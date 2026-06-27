
-- Organizations: 1 NGO = 1 auth user = 1 org row
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  organization_type text,
  country_focus text[] NOT NULL DEFAULT '{}',
  source_languages text[] NOT NULL DEFAULT '{}',
  focus_areas text[] NOT NULL DEFAULT '{}',
  selected_template text NOT NULL DEFAULT 'burundi-kids',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org reads own row"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Org inserts own row"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Org updates own row"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Dashboard preferences
CREATE TABLE public.dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  selected_template text NOT NULL DEFAULT 'burundi-kids',
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  visible_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_preferences TO authenticated;
GRANT ALL ON public.dashboard_preferences TO service_role;

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org reads own prefs"
  ON public.dashboard_preferences FOR SELECT TO authenticated
  USING (organization_id = auth.uid());
CREATE POLICY "Org inserts own prefs"
  ON public.dashboard_preferences FOR INSERT TO authenticated
  WITH CHECK (organization_id = auth.uid());
CREATE POLICY "Org updates own prefs"
  ON public.dashboard_preferences FOR UPDATE TO authenticated
  USING (organization_id = auth.uid()) WITH CHECK (organization_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_touch BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER dashboard_preferences_touch BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create organization + default dashboard_preferences from auth signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  tpl text := COALESCE(meta->>'selected_template', 'burundi-kids');
BEGIN
  INSERT INTO public.organizations (id, name, email, organization_type, country_focus, source_languages, focus_areas, selected_template)
  VALUES (
    NEW.id,
    COALESCE(meta->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    meta->>'organization_type',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'country_focus')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'source_languages')), '{}'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'focus_areas')), '{}'),
    tpl
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.dashboard_preferences (organization_id, selected_template)
  VALUES (NEW.id, tpl)
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();
