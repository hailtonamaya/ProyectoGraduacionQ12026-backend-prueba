-- ============================================
-- Migration: Plataforma de Elecciones Estudiantiles
-- ============================================

-- Campus
CREATE TABLE IF NOT EXISTS campus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career
CREATE TABLE IF NOT EXISTS career (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  campus_id UUID REFERENCES campus(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin
CREATE TABLE IF NOT EXISTS admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin_master', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Election
CREATE TABLE IF NOT EXISTS election (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  campus_id UUID REFERENCES campus(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_by UUID REFERENCES admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Association (planilla/partido)
CREATE TABLE IF NOT EXISTS association (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES election(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  photo_url TEXT,
  career_id UUID REFERENCES career(id),
  min_votes INTEGER DEFAULT 0,
  max_votes INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidate
CREATE TABLE IF NOT EXISTS candidate (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES association(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  photo_url TEXT,
  role VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voter
CREATE TABLE IF NOT EXISTS voter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES election(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  career_id UUID REFERENCES career(id),
  voting_code VARCHAR(10),
  has_voted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vote
CREATE TABLE IF NOT EXISTS vote (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES election(id),
  voter_id UUID NOT NULL REFERENCES voter(id),
  association_id UUID REFERENCES association(id),
  is_blank BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: un votante solo puede votar una vez por eleccion
ALTER TABLE vote ADD CONSTRAINT unique_voter_election UNIQUE (voter_id, election_id);

-- Unique constraint: account_number unico por eleccion
ALTER TABLE voter ADD CONSTRAINT unique_account_election UNIQUE (account_number, election_id);

-- Index para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_association_election ON association(election_id);
CREATE INDEX IF NOT EXISTS idx_candidate_association ON candidate(association_id);
CREATE INDEX IF NOT EXISTS idx_voter_election ON voter(election_id);
CREATE INDEX IF NOT EXISTS idx_vote_election ON vote(election_id);
CREATE INDEX IF NOT EXISTS idx_election_status ON election(status);

-- Seed: Admin master inicial
-- Password: admin123 (hash generado con bcryptjs)
INSERT INTO admin (email, password_hash, full_name, role)
VALUES ('admin@elecciones.edu', '$2b$10$.S4zeivYvFxGCOZqBXTU/eq2.dZNoENOhJdkylVFN2cveHuBBl.Xu', 'Admin Master', 'admin_master')
ON CONFLICT (email) DO NOTHING;
