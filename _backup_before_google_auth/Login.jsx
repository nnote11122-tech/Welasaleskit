import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WELA_RED = '#E14D43';

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from || '/';

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError('Email หรือ Password ไม่ถูกต้อง');
      setSubmitting(false);
    } else {
      navigate(from, { replace: true });
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            required
            autoFocus
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

        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-10">
          © 2026 Asakan Development
        </p>
      </div>
    </div>
  );
}
