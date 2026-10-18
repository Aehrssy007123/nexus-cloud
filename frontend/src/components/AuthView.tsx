import React, { useState } from 'react';
import {
  Server,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Database,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/api.js';
import { User } from '../types.js';
import { useToast } from './Toast.js';

interface AuthViewProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authService.login(email.trim(), password);
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        success('Welcome back', `Signed in as ${data.user.name}`);
        onAuthSuccess(data.user, data.token);
      } else {
        const data = await authService.register(name.trim(), email.trim(), password);
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        success('Account created', `Your personal cloud storage is ready.`);
        onAuthSuccess(data.user, data.token);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      setErrorMsg(msg);
      error('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setName('Lab Admin');
    setEmail('admin@nexus.lan');
    setPassword('admin123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#171816] text-[#F4F0E8] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand & Project Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D97736] to-[#E9A65A] shadow-xl shadow-[#D97736]/20 mb-2">
            <Server className="w-7 h-7 text-[#171816]" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-[#F4F0E8]">
            NEXUS<span className="text-[#D97736]">CLOUD</span>
          </h1>
          <p className="text-xs text-[#AAA69B] max-w-sm mx-auto leading-relaxed">
            Setup Your Own Cloud for Software as a Service (SaaS) over an Existing LAN Using a Custom Cloud Controller and HDFS
          </p>
        </div>

        {/* Auth Card */}
        <div className="nexus-card p-6 shadow-2xl backdrop-blur-md bg-[#2B2C27]/90 border-[#393A33]">
          {/* Tabs */}
          <div className="flex border-b border-[#393A33] mb-5">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
              }}
              className={`flex-1 pb-3 text-xs font-mono font-semibold transition-all ${
                isLogin
                  ? 'text-[#F4F0E8] border-b-2 border-[#D97736]'
                  : 'text-[#AAA69B] hover:text-[#F4F0E8]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
              }}
              className={`flex-1 pb-3 text-xs font-mono font-semibold transition-all ${
                !isLogin
                  ? 'text-[#F4F0E8] border-b-2 border-[#D97736]'
                  : 'text-[#AAA69B] hover:text-[#F4F0E8]'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#D97736]/15 border border-[#D97736]/40 text-xs text-[#F4F0E8]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-[#AAA69B] mb-1.5 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#AAA69B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="nexus-input pl-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#AAA69B] mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#AAA69B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@nexus.lan"
                  className="nexus-input pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA69B] mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA69B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nexus-input pl-9 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full nexus-btn-primary py-2.5 text-xs font-semibold shadow-md mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Access Cloud Console' : 'Register & Launch'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo fill shortcut */}
          <div className="mt-5 pt-4 border-t border-[#393A33] flex items-center justify-between text-[11px] text-[#AAA69B]">
            <span>College Lab Evaluation:</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[#E9A65A] hover:underline flex items-center gap-1 font-mono font-medium"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Security / Arch Footer Badge */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#AAA69B] font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8EA58A]" />
            Bcrypt + JWT Auth
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#E9A65A]" />
            HDFS Block Layer
          </span>
        </div>
      </div>
    </div>
  );
};
