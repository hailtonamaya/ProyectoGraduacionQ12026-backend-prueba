-- ============================================================
-- PLATAFORMA DIGITAL PARA VOTACIONES ESTUDIANTILES
-- Compatible con Supabase (PostgreSQL)
-- ============================================================

-- ============================================================
-- 0. ADMINISTRADORES (tabla independiente de auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
  admin_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'admin'
                    CHECK (role IN ('admin_master', 'admin')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 1. ORGANIZACIONES / ASOCIACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS organization (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PERFILES DE VOTANTE
-- ============================================================
CREATE TABLE IF NOT EXISTS voter_profile (
  voter_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID NOT NULL UNIQUE,
  institutional_id  VARCHAR(20) NOT NULL UNIQUE,
  full_name         VARCHAR(200) NOT NULL,
  organization_id   UUID NOT NULL REFERENCES organization(organization_id),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. ELECCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS election (
  election_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  status          VARCHAR(10) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'open', 'closed')),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  organization_id UUID NOT NULL REFERENCES organization(organization_id),
  created_by      UUID REFERENCES admin(admin_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (end_at > start_at)
);

-- ============================================================
-- 4. CARGOS (posiciones a elegir dentro de una eleccion)
-- ============================================================
CREATE TABLE IF NOT EXISTS position (
  position_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id     UUID NOT NULL REFERENCES election(election_id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  min_votes       INT NOT NULL DEFAULT 1,
  max_votes       INT NOT NULL DEFAULT 1,
  allows_blank    BOOLEAN NOT NULL DEFAULT TRUE,
  position_order  INT NOT NULL DEFAULT 1,
  CONSTRAINT chk_votes CHECK (max_votes >= min_votes AND min_votes >= 0)
);

-- ============================================================
-- 5. CANDIDATOS
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate (
  candidate_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(200) NOT NULL,
  bio             TEXT,
  photo_url       TEXT,
  organization_id UUID REFERENCES organization(organization_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. CANDIDATO EN CARGO (N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_in_position (
  candidate_in_position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id   UUID NOT NULL REFERENCES position(position_id) ON DELETE CASCADE,
  candidate_id  UUID NOT NULL REFERENCES candidate(candidate_id) ON DELETE CASCADE,
  UNIQUE (position_id, candidate_id)
);

-- ============================================================
-- 7. HABILITACION DE VOTANTE EN ELECCION
-- ============================================================
CREATE TABLE IF NOT EXISTS election_voter (
  election_voter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   UUID NOT NULL REFERENCES election(election_id) ON DELETE CASCADE,
  voter_id      UUID NOT NULL REFERENCES voter_profile(voter_id) ON DELETE CASCADE,
  has_voted     BOOLEAN NOT NULL DEFAULT FALSE,
  voted_at      TIMESTAMPTZ,
  UNIQUE (election_id, voter_id)
);

-- ============================================================
-- 8. BOLETA (SIN referencia al votante = anonimato)
-- ============================================================
CREATE TABLE IF NOT EXISTS ballot (
  ballot_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   UUID NOT NULL REFERENCES election(election_id) ON DELETE CASCADE,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. VOTO POR CARGO
-- ============================================================
CREATE TABLE IF NOT EXISTS ballot_vote (
  ballot_vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ballot_id      UUID NOT NULL REFERENCES ballot(ballot_id) ON DELETE CASCADE,
  position_id    UUID NOT NULL REFERENCES position(position_id),
  candidate_in_position_id UUID REFERENCES candidate_in_position(candidate_in_position_id),
  is_blank       BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_blank_xor_candidate
    CHECK (
      (is_blank = TRUE AND candidate_in_position_id IS NULL) OR
      (is_blank = FALSE AND candidate_in_position_id IS NOT NULL)
    )
);

-- ============================================================
-- 10. INDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_election_status       ON election(status);
CREATE INDEX IF NOT EXISTS idx_election_org_status   ON election(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ballot_vote_position  ON ballot_vote(position_id);
CREATE INDEX IF NOT EXISTS idx_ballot_vote_candidate ON ballot_vote(candidate_in_position_id);
CREATE INDEX IF NOT EXISTS idx_election_voter_lookup ON election_voter(election_id, voter_id, has_voted);
CREATE INDEX IF NOT EXISTS idx_ballot_election       ON ballot(election_id);
CREATE INDEX IF NOT EXISTS idx_cip_position          ON candidate_in_position(position_id);

-- ============================================================
-- 11. VISTAS PARA REPORTES
-- ============================================================

CREATE OR REPLACE VIEW v_results_by_position AS
SELECT
  e.election_id,
  e.title            AS election_title,
  p.position_id,
  p.name             AS position_name,
  c.candidate_id,
  c.full_name        AS candidate_name,
  org.name           AS candidate_org,
  COUNT(bv.ballot_vote_id) AS total_votes,
  COUNT(bv.ballot_vote_id) * 100.0
    / NULLIF(COUNT(*) OVER (PARTITION BY p.position_id), 0) AS vote_percentage
FROM election e
JOIN position p          ON p.election_id = e.election_id
JOIN ballot_vote bv      ON bv.position_id = p.position_id AND bv.is_blank = FALSE
JOIN candidate_in_position cip ON cip.candidate_in_position_id = bv.candidate_in_position_id
JOIN candidate c         ON c.candidate_id = cip.candidate_id
LEFT JOIN organization org ON org.organization_id = c.organization_id
GROUP BY e.election_id, e.title, p.position_id, p.name,
         c.candidate_id, c.full_name, org.name;

CREATE OR REPLACE VIEW v_participation AS
SELECT
  e.election_id,
  e.title,
  e.status,
  COUNT(ev.election_voter_id)                  AS total_habilitados,
  COUNT(ev.election_voter_id) FILTER (WHERE ev.has_voted = TRUE) AS total_votaron,
  ROUND(
    COUNT(ev.election_voter_id) FILTER (WHERE ev.has_voted = TRUE) * 100.0
    / NULLIF(COUNT(ev.election_voter_id), 0), 2
  )                                            AS participacion_pct
FROM election e
LEFT JOIN election_voter ev ON ev.election_id = e.election_id
GROUP BY e.election_id, e.title, e.status;

CREATE OR REPLACE VIEW v_blank_votes AS
SELECT
  p.election_id,
  p.position_id,
  p.name AS position_name,
  COUNT(bv.ballot_vote_id) AS blank_votes
FROM position p
JOIN ballot_vote bv ON bv.position_id = p.position_id AND bv.is_blank = TRUE
GROUP BY p.election_id, p.position_id, p.name;

-- ============================================================
-- 12. SEED: Admin master (password: admin123)
-- ============================================================
INSERT INTO admin (email, password_hash, full_name, role)
VALUES ('admin@elecciones.edu', '$2b$10$.S4zeivYvFxGCOZqBXTU/eq2.dZNoENOhJdkylVFN2cveHuBBl.Xu', 'Admin Master', 'admin_master')
ON CONFLICT (email) DO NOTHING;
