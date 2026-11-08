import React, { useState } from 'react';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useDriveStore } from '../../store/useDriveStore';

export const AuthModal: React.FC = () => {
  const { isAuthenticated, login, register, error, setError, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) {
        useDriveStore.getState().fetchItems();
      }
    } else {
      const ok = await register(name, email, password);
      if (ok) {
        useDriveStore.getState().fetchItems();
      }
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    const ok = await login('demo@google.com', 'password123');
    if (ok) {
      useDriveStore.getState().fetchItems();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-slide-up space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <svg className="w-12 h-11" viewBox="0 0 87.3 78" fill="none">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          <h2 className="text-2xl font-normal text-[#1f1f1f]">Google Drive</h2>
          <p className="text-sm text-[#5f6368]">
            {mode === 'login' ? 'Sign in to access your cloud storage' : 'Create an account to get 15 GB free'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#f0f4f9] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#0b57d0] shadow-sm font-semibold'
                : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-[#0b57d0] shadow-sm font-semibold'
                : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#0b57d0] rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 border border-[#0b57d0]/20"
        >
          <Sparkles className="w-4 h-4 text-[#1a73e8]" />
          <span>Quick Demo Login (demo@google.com)</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase">Or continue with email</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-[#444746] block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0b57d0] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#444746] block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0b57d0] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#444746] block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0b57d0] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0b57d0] hover:bg-[#0842a0] disabled:bg-gray-300 text-white rounded-full text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

