-- ============================================================
-- Profiles table สำหรับ role management
-- รันใน Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       text,
  role       text NOT NULL DEFAULT 'sales' CHECK (role IN ('manager', 'sales')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile เมื่อสมัคร user ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, NEW.email, 'sales')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- วิธีเปลี่ยน user เป็น manager:
-- UPDATE profiles SET role = 'manager' WHERE id = 'uuid-ของ-user';
--
-- ดู user id ทั้งหมด:
-- SELECT u.email, p.role FROM auth.users u JOIN profiles p ON u.id = p.id;
-- =====================================================
