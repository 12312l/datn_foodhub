import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Mã xác thực phải có 6 chữ số');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authAPI.verifyCode(email, code);
      alert('Xác thực thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã xác thực không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authAPI.sendVerification(email);
      alert('Mã xác thực đã được gửi lại!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gửi mã thất bại');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500">Không tìm thấy email. Vui lòng đăng ký lại.</p>
          <button onClick={() => navigate('/register')} className="btn btn-primary mt-4">
            Đăng ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-500">Xác thực email</h1>
            <p className="text-gray-600 mt-2">
              Nhập mã xác thực 6 số đã gửi đến email của bạn
            </p>
            <p className="text-sm text-gray-500 mt-1">{email}</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã xác thực
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Không nhận được mã?{' '}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-primary-500 hover:underline font-medium"
              >
                {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Quay lại đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
