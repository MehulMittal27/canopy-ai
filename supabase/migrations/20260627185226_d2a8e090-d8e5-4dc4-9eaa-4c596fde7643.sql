DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_organization() CASCADE;
DROP TABLE IF EXISTS public.dashboard_preferences CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;