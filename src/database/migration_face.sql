
CREATE TABLE IF NOT EXISTS face_registration (
  face_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  full_name       VARCHAR(200) NOT NULL,
  face_descriptor JSONB NOT NULL,       -- Array de 128 floats (embedding facial)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice para busqueda rapida por email
CREATE INDEX IF NOT EXISTS idx_face_registration_email ON face_registration(email);

-- Permisos para que el service_role de Supabase pueda operar
ALTER TABLE face_registration ENABLE ROW LEVEL SECURITY;

-- Politica para permitir todas las operaciones desde el backend (service_role)
CREATE POLICY "service_role_full_access" ON face_registration
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON face_registration TO service_role;
GRANT ALL ON face_registration TO postgres;
