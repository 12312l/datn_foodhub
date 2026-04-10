import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, X, Image } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  isFromAdmin: boolean;
}

const AdminChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      setAttachments([]);
      setPreviewUrls((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    }
  }, [selectedConversation]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations({ page: 0, size: 50 });
      const convData = response.data.content.map((conv: any) => ({
        id: conv.id,
        userId: conv.userId,
        userName: conv.userName || 'Người dùng',
        userEmail: conv.userEmail || '',
        status: conv.status,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime
      }));
      setConversations(convData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await chatAPI.getMessages(conversationId, { page: 0, size: 100 });
      const msgData = response.data.content.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        isFromAdmin: msg.isFromAdmin
      }));
      setMessages(msgData);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !user) return;

    setSending(true);
    try {
      let uploadedUrls: string[] = [];
      if (attachments.length > 0) {
        setUploading(true);
        const formData = new FormData();
        attachments.forEach((file) => formData.append('files', file));
        const uploadResponse = await axios.post('/api/uploads/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls = uploadResponse.data;
        setUploading(false);
      }

      const messageText = newMessage.trim();
      const content = uploadedUrls.length > 0
        ? messageText + (messageText ? '\n' : '') + uploadedUrls.join('\n')
        : messageText;

      await chatAPI.sendMessage(selectedConversation.id, {
        senderId: user.id,
        content,
      });

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setNewMessage('');
      setAttachments([]);
      setPreviewUrls([]);
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    setAttachments((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => [...prev, url]);
    });

    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|mkv|avi)(\?.*)?$/i.test(url);

  const renderMessageBody = (content: string) => {
    const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
    const mediaUrls = lines.filter((line) => isImageUrl(line) || isVideoUrl(line));
    const textContent = lines.filter((line) => !mediaUrls.includes(line)).join('\n');

    return (
      <>
        {textContent && <p className="whitespace-pre-wrap break-words">{textContent}</p>}
        {mediaUrls.length > 0 && (
          <div className="mt-2 space-y-2">
            {mediaUrls.map((url, idx) => (
              <div key={`${url}-${idx}`}>
                {isVideoUrl(url) ? (
                  <video src={url} controls className="max-w-64 rounded" />
                ) : (
                  <img src={url} alt="attachment" className="max-w-64 rounded" />
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4">
      {/* Conversation List */}
      <div className="w-1/3 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Tin nhắn
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.userName}</p>
                    <p className="text-sm text-gray-500 truncate">{conv.userEmail}</p>
                  </div>
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{conv.lastMessage}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium">{selectedConversation.userName}</p>
                  <p className="text-sm text-gray-500">{selectedConversation.userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                (() => {
                  const isAdminSender = msg.senderId === user?.id || msg.isFromAdmin;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isAdminSender ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdminSender && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isAdminSender ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <span className="text-[11px] text-gray-500 px-1">
                          {isAdminSender ? 'Admin' : selectedConversation?.userName || 'Khách hàng'}
                        </span>
                        <div
                          className={`p-3 rounded-2xl ${
                            isAdminSender
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          {renderMessageBody(msg.content)}
                        </div>
                        <p className="text-[11px] text-gray-400 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {isAdminSender && (
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          A
                        </div>
                      )}
                    </div>
                  );
                })()
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              {previewUrls.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      {attachments[index].type.startsWith('video/') ? (
                        <video src={url} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <img src={url} alt="preview" className="w-16 h-16 object-cover rounded" />
                      )}
                      <button
                        type="button"
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
                  disabled={sending || uploading}
                >
                  <Image className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 input"
                  disabled={sending || uploading}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && attachments.length === 0) || sending || uploading}
                  className="btn btn-primary px-4"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chọn một cuộc trò chuyện để xem tin nhắn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPage;
