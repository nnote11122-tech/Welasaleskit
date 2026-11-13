import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// ล็อกอินสำเร็จ (เช่นด้วย Google) แต่ไม่มีแถวใน profiles = ยังไม่ได้รับสิทธิ์
const NO_ACCESS = 'บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ';

// Supabase ส่ง error กลับมาใน URL หลัง OAuth (เช่น signup_disabled เมื่ออีเมลไม่มีบัญชี)
// ต้องอ่านตอนโหลดครั้งแรก ก่อน router redirect ไป /login แล้ว query/hash หายไป
function readOAuthError() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = params.get('error_code') || hash.get('error_code');
  const err  = params.get('error') || hash.get('error');
  if (!code && !err) return '';
  window.history.replaceState(null, '', window.location.pathname);
  if (code === 'signup_disabled' || code === 'user_banned') return NO_ACCESS;
  return 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่';
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(readOAuthError);

  // คืน role หรือ null ถ้าไม่มี profile (ไม่ default เป็น 'sales' แล้ว
  // เพราะ Google login ให้ใครก็ได้ยืนยันตัวตนได้ ต้องมี profile ถึงจะเข้าได้)
  const fetchRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.role ?? null;
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeout);
      if (!session?.user) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      // เรียก supabase ต่อนอก callback เพื่อเลี่ยง deadlock ของ onAuthStateChange
      setTimeout(async () => {
        try {
          const r = await fetchRole(session.user.id);
          if (!r) {
            setAuthError(NO_ACCESS);
            await supabase.auth.signOut();
            return;
          }
          setAuthError('');
          setUser(session.user);
          setRole(r);
        } catch {
          setAuthError('ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองใหม่');
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn  = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signInWithGoogle = (redirectPath = '/') =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + redirectPath,
        // ให้เลือกบัญชีทุกครั้ง ไม่งั้น Google ใช้บัญชีเดิมอัตโนมัติจนเปลี่ยนบัญชีไม่ได้
        queryParams: { prompt: 'select_account' },
      },
    });
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, role, loading, authError, signIn, signInWithGoogle, signOut, isManager: role === 'manager' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
