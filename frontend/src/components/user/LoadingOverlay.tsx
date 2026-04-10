import React, { useEffect, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, children }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
