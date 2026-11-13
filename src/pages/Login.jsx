import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WELA_RED = '#E14D43';

export default function Login() {
  const { user, authError, signIn, signInWithGoogle } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from || '/';

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // เข้าได้เมื่อ AuthContext ตรวจ profile ผ่านแล้วเท่านั้น
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  useEffect(() => {
    if (authError) { setError(authError); setSubmitting(false); }
  }, [authError]);

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    const { error } = await signInWithGoogle(from);
    if (error) {
      setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError('Email หรือ Password ไม่ถูกต้อง');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-red-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm text-center relative z-10">
        <div className="mb-10">
          <span className="text-[10px] tracking-[0.8em] uppercase text-white/40 font-bold block mb-3">
            STAFF LOGIN
          </span>
          <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase">
            WE<span style={{ color: WELA_RED }}>L</span>A
          </h1>
          <div className="w-8 h-[2px] mx-auto mt-4" style={{ backgroundColor: WELA_RED }} />
          <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-4">
            Ramkhamhaeng 186
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-white text-[#1f1f1f] font-bold text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Sign in with Google
        </button>

        {!showPassword && (
          <>
            {error && <p className="text-red-400 text-[11px] font-bold text-center mt-3">{error}</p>}
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-6 hover:text-white/60"
            >
              เข้าด้วย Email / Password
            </button>
          </>
        )}

        {showPassword && (
        <form onSubmit={handleSubmit} className="space-y-3 mt-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 font-bold outline-none focus:border-red-500/50 transition-all text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 font-bold outline-none focus:border-red-500/50 transition-all text-sm"
          />

          {error && (
            <p className="text-red-400 text-[11px] font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-5 rounded-2xl font-black tracking-[0.4em] uppercase transition-all shadow-2xl active:scale-95 disabled:opacity-50 text-white mt-2"
            style={{ backgroundColor: WELA_RED }}
          >
            {submitting ? '...' : 'SIGN IN'}
          </button>
        </form>
        )}

        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-10">
          © 2026 Asakan Development
        </p>
      </div>
    </div>
  );
}
