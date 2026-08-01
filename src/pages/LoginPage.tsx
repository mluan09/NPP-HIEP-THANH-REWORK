import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import type { Profile } from '../lib/db';
import testUsers from '../data/test-users.json';
import { useToast } from '../components/Toast';

interface LoginPageProps {
  profiles: Profile[];
  onLoginSuccess: (profile: Profile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ profiles, onLoginSuccess }) => {
  const { showToast } = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ employeeId: '', password: '' });

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);

    // Maintain focus and keep cursor at the end
    setTimeout(() => {

      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
        const length = passwordInputRef.current.value.length;
        passwordInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const nextFieldErrors = {
      employeeId: employeeId.trim() ? '' : 'Vui lòng nhập Mã Nhân Viên',
      password: password ? '' : 'Vui lòng nhập Mật Khẩu',
    };

    setFieldErrors(nextFieldErrors);
    setError('');

    if (nextFieldErrors.employeeId || nextFieldErrors.password) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = testUsers.find(
        (u) =>
          u.employeeId.trim().toUpperCase() === employeeId.trim().toUpperCase() &&
          u.password === password
      );

      if (matchedUser) {
        const profile = profiles.find((p) => p.id === matchedUser.profileId) || profiles[0];
        showToast('Đăng nhập thành công!');
        onLoginSuccess(profile);
      } else {
        setError('Mã nhân viên hoặc Mật khẩu không chính xác.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/70 backdrop-blur-2xl border border-slate-800/60 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col items-center gap-4 pb-2">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border border-amber-500/20 shadow-lg shadow-amber-500/10 bg-slate-800/50 flex items-center justify-center">
            <img
              src="/logo-new.png"
              alt="NPP Hiệp Thành Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('login-logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div
              id="login-logo-fallback"
              className="hidden items-center justify-center w-full h-full"
            >
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 text-lg leading-tight tracking-wider uppercase text-center">
                NPP<br />HIỆP THÀNH
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-widest uppercase">
              NPP Hiệp Thành
            </h1>
            <h2 className="text-lg font-bold text-slate-100">
              Hệ Thống Quản Lý Phân Phối
            </h2>
            <p className="text-xs text-slate-500">
              Dành cho Nhà phân phối Bia &amp; Nước giải khát Hiệp Thành
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800/60" />

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="employee-id-input"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
            >
              Mã nhân viên
            </label>
            <div className="relative">
              <input
                id="employee-id-input"
                type="text"
                autoComplete="username"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  if (fieldErrors.employeeId) {
                    setFieldErrors((prev) => ({ ...prev, employeeId: '' }));
                  }
                }}
                placeholder="Nhập mã nhân viên được ADMIN cấp"
                aria-invalid={Boolean(fieldErrors.employeeId)}
                aria-describedby={fieldErrors.employeeId ? 'employee-id-error' : undefined}
                className={`w-full bg-slate-800/80 border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-100 transition-all placeholder:text-slate-500 ${fieldErrors.employeeId
                  ? 'border-rose-500/80 focus:ring-rose-500/40 animate-[pulse_1.2s_ease-in-out_1]'
                  : 'border-slate-700/50 focus:ring-amber-500/50'
                  }`}
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <AnimatePresence>
                {fieldErrors.employeeId && (
                  <motion.div
                    id="employee-id-error"
                    role="alert"
                    initial={{ opacity: 0, x: -10, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className="mt-2 md:absolute md:left-full md:top-1/2 md:mt-0 md:ml-3 md:-translate-y-1/2 z-10 flex items-center gap-2 whitespace-nowrap rounded-xl border border-rose-400/25 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 shadow-lg shadow-rose-950/25 backdrop-blur-md"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {fieldErrors.employeeId}
                    <span className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8 border-r-rose-400/25" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password-input"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Nhập mật khẩu"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`w-full bg-slate-800/80 border rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 text-slate-100 transition-all placeholder:text-slate-500 ${fieldErrors.password
                  ? 'border-rose-500/80 focus:ring-rose-500/40 animate-[pulse_1.2s_ease-in-out_1]'
                  : 'border-slate-700/50 focus:ring-amber-500/50'
                  }`}
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <button
                type="button"
                onClick={handleTogglePassword}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-slate-100 p-0.5 rounded transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.div
                    id="password-error"
                    role="alert"
                    initial={{ opacity: 0, x: -10, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className="mt-2 md:absolute md:left-full md:top-1/2 md:mt-0 md:ml-3 md:-translate-y-1/2 z-10 flex items-center gap-2 whitespace-nowrap rounded-xl border border-rose-400/25 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 shadow-lg shadow-rose-950/25 backdrop-blur-md"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {fieldErrors.password}
                    <span className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8 border-r-rose-400/25" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="text-red-400 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-3"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
