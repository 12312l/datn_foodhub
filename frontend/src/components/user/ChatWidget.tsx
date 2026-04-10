import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Headphones, Bot, Image } from 'lucide-react';
import { aiAPI, chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: { type: 'image' | 'video'; url: string }[];
}

interface ChatApiMessage {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

// Simple markdown parser
const parseMarkdown = (text: string) => {
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  parsed = parsed.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-2 rounded my-2 overflow-x-auto text-sm"><code>$1</code></pre>');
  parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
  parsed = parsed.replace(/\n/g, '<br/>');
  return parsed;
};

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|mkv|avi)(\?.*)?$/i.test(url);

const renderMessageBody = (content: string) => {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const mediaUrls = lines.filter((line) => isImageUrl(line) || isVideoUrl(line));
  const textContent = lines.filter((line) => !mediaUrls.includes(line)).join('\n');

  return (
    <>
      {textContent && (
        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent) }} />
      )}
      {mediaUrls.length > 0 && (
        <div className={`${textContent ? 'mt-2' : ''} space-y-2`}>
          {mediaUrls.map((url, idx) => (
            <div key={`${url}-${idx}`}>
              {isVideoUrl(url) ? (
                <video src={url} controls className="max-w-56 rounded-lg" />
              ) : (
                <img
                  src={url}
                  alt="attachment"
                  className="max-w-56 rounded-lg cursor-pointer"
                  onClick={() => window.open(url, '_blank')}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ChatWidget: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'admin'>('ai');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store messages separately for each mode
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý FoodHub. Bạn cần hỗ trợ gì?\n\nTôi có thể giúp bạn:\n• Tìm món ăn\n• Đặt món\n• Kiểm tra đơn hàng\n• Giải đáp thắc mắc',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    setAttachments(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });

    // Reset input
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý FoodHub. Bạn cần hỗ trợ gì?\n\nTôi có thể giúp bạn:\n• Tìm món ăn\n• Đặt món\n• Kiểm tra đơn hàng\n• Giải đáp thắc mắc',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update messages when switching modes
  useEffect(() => {
    if (chatMode === 'admin') {
      if (adminMessages.length > 0) {
        setMessages([...adminMessages]);
      } else {
        setMessages([{
          id: '1',
          text: 'Chào bạn! Nhắn tin để được hỗ trợ trực tiếp từ shop.',
          isUser: false,
          timestamp: new Date()
        }]);
      }
    } else {
      if (aiMessages.length > 0) {
        setMessages([...aiMessages]);
      } else {
        setMessages([{
          id: '1',
          text: 'Xin chào! Tôi là trợ lý FoodHub. Bạn cần hỗ trợ gì?\n\nTôi có thể giúp bạn:\n• Tìm món ăn\n• Đặt món\n• Kiểm tra đơn hàng\n• Giải đáp thắc mắc',
          isUser: false,
          timestamp: new Date()
        }]);
      }
    }
  }, [chatMode, adminMessages, aiMessages]);

  // Load real chat messages when switching to admin mode
  const loadAdminMessages = useCallback(async () => {
    if (!user) return;
    try {
      // Get or create conversation for this specific user
      const convResponse = await chatAPI.getConversations({ page: 0, size: 1, userId: user.id });
      const conversations = convResponse.data.content;

      if (conversations.length > 0) {
        const conv = conversations[0];
        setConversationId(conv.id);
        const msgResponse = await chatAPI.getMessages(conv.id, { page: 0, size: 100 });
        const newAdminMessages: Message[] = msgResponse.data.content.map((msg: ChatApiMessage) => ({
          id: msg.id.toString(),
          text: msg.content,
          isUser: msg.senderId === user.id,
          timestamp: new Date(msg.createdAt)
        }));
        setAdminMessages(newAdminMessages);
        setMessages(newAdminMessages);
      } else {
        const emptyMessages = [{
          id: '1',
          text: 'Chào bạn! Nhắn tin để được hỗ trợ trực tiếp từ shop.',
          isUser: false,
          timestamp: new Date()
        }];
        setAdminMessages(emptyMessages);
        setMessages(emptyMessages);
      }
    } catch (error) {
      console.error('Error loading admin chat:', error);
      const errorMessages = [{
        id: '1',
        text: 'Chào bạn! Nhắn tin để được hỗ trợ trực tiếp từ shop.',
        isUser: false,
        timestamp: new Date()
      }];
      setAdminMessages(errorMessages);
      setMessages(errorMessages);
    }
  }, [user]);

  const handleSwitchMode = (mode: 'ai' | 'admin') => {
    setChatMode(mode);
    if (mode === 'admin' && isAuthenticated) {
      loadAdminMessages();
    } else {
      // Switch to AI messages (keep existing or reset)
      setMessages(aiMessages.length > 0 ? aiMessages : [{
        id: '1',
        text: 'Xin chào! Tôi là trợ lý FoodHub. Bạn cần hỗ trợ gì?\n\nTôi có thể giúp bạn:\n• Tìm món ăn\n• Đặt món\n• Kiểm tra đơn hàng\n• Giải đáp thắc mắc',
        isUser: false,
        timestamp: new Date()
      }]);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    const newAttachments = attachments.map(file => ({
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      url: URL.createObjectURL(file)
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
      attachments: newAttachments
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText('');
    setAttachments([]);
    setPreviewUrls([]);
    setIsLoading(true);

    try {
      if (chatMode === 'admin' && isAuthenticated && user) {
        // Upload attachments first
        let uploadedUrls: string[] = [];
        if (attachments.length > 0) {
          setUploading(true);
          const formData = new FormData();
          attachments.forEach(file => {
            formData.append('files', file);
          });

          const uploadResponse = await axios.post('/api/uploads/chat', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedUrls = uploadResponse.data;
          setUploading(false);
        }

        // Send to admin chat
        let convId = conversationId;
        if (!convId) {
          try {
            const convResponse = await chatAPI.startConversation(user.id);
            convId = convResponse.data.id;
            setConversationId(convId);
          } catch {
            // Use existing conversation
          }
        }

        if (convId) {
          const content = uploadedUrls.length > 0
            ? messageToSend + (messageToSend ? '\n' : '') + uploadedUrls.join('\n')
            : messageToSend;

          await chatAPI.sendMessage(convId, {
            senderId: user.id,
            content: content
          });

          const msgResponse = await chatAPI.getMessages(convId, { page: 0, size: 100 });
          const newAdminMessages: Message[] = msgResponse.data.content.map((msg: ChatApiMessage) => ({
            id: msg.id.toString(),
            text: msg.content,
            isUser: msg.senderId === user.id,
            timestamp: new Date(msg.createdAt)
          }));
          setAdminMessages(newAdminMessages);
          setMessages(newAdminMessages);
        }
      } else {
        // Send to AI chat
        const response = await aiAPI.chat(messageToSend, isAuthenticated ? user?.id : undefined);
        const botText = response.data?.response || response.data?.message || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.';

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botText,
          isUser: false,
          timestamp: new Date()
        };
        const updatedAiMessages = [...aiMessages, userMessage, botMessage];
        setAiMessages(updatedAiMessages);
        setMessages(updatedAiMessages);
      }
    } catch (error: unknown) {
      console.error('Chat error:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: apiError.response?.data?.message || 'Xin lỗi, đã xảy ra lỗi. Bạn thử lại sau nhé.',
        isUser: false,
        timestamp: new Date()
      };
      if (chatMode === 'admin') {
        setAdminMessages(prev => [...prev, errorMessage]);
      } else {
        setAiMessages(prev => [...prev, errorMessage]);
      }
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-all z-40"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-40 border">
          {/* Header */}
          <div className="bg-primary-500 text-white p-4 rounded-t-lg flex-shrink-0">
            <h3 className="font-semibold">Chat với FoodHub</h3>
            <p className="text-xs opacity-80">
              {chatMode === 'ai' ? 'Trợ lý AI tự động' : 'Hỗ trợ trực tiếp từ shop'}
            </p>
          </div>

          {/* Mode Toggle - Only show for authenticated users */}
          {isAuthenticated && (
            <div className="flex border-b">
              <button
                onClick={() => handleSwitchMode('ai')}
                className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                  chatMode === 'ai' ? 'bg-primary-50 text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Bot className="w-4 h-4" />
                AI
              </button>
              <button
                onClick={() => handleSwitchMode('admin')}
                className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
                  chatMode === 'admin' ? 'bg-primary-50 text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Headphones className="w-4 h-4" />
                Shop
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0 self-start">
                    {chatMode === 'ai' ? <Bot className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <span className="text-[11px] text-gray-500 px-1">
                    {msg.isUser ? 'Bạn' : chatMode === 'ai' ? 'AI FoodHub' : 'Shop'}
                  </span>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx}>
                          {att.type === 'video' ? (
                            <video
                              src={att.url}
                              controls
                              className="max-w-48 rounded-lg"
                            />
                          ) : (
                            <img
                              src={att.url}
                              alt="attachment"
                              className="max-w-48 rounded-lg cursor-pointer"
                              onClick={() => window.open(att.url, '_blank')}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.isUser
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {renderMessageBody(msg.text)}
                  </div>
                  <span className="text-[11px] text-gray-400 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {user?.fullName?.charAt(0).toUpperCase() || 'B'}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Đang trả lời...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex-shrink-0">
            {chatMode === 'admin' && !isAuthenticated ? (
              <p className="text-sm text-gray-500 text-center py-2">
                Vui lòng đăng nhập để chat với shop
              </p>
            ) : (
              <>
                {/* Attachment Preview */}
                {previewUrls.length > 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        {attachments[index].type.startsWith('video/') ? (
                          <video src={url} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <img src={url} alt="preview" className="w-16 h-16 object-cover rounded" />
                        )}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {/* File upload buttons for admin mode */}
                  {chatMode === 'admin' && isAuthenticated && (
                    <div className="flex gap-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded"
                        title="Gửi ảnh hoặc video"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={chatMode === 'admin' ? 'Nhắn tin cho shop...' : 'Hỏi AI...'}
                    className="flex-1 input text-sm"
                    disabled={isLoading || uploading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!inputText.trim() && attachments.length === 0) || isLoading || uploading}
                    className="btn btn-primary px-3"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
