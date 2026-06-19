-- ECE AI Assistant — Core Schema
-- Migration 001: users, queries, scans tables + RLS policies
-- Run ONCE in Supabase SQL Editor. Run in order.

-- ═══════════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════════
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  TEXT        UNIQUE NOT NULL,
  email         TEXT        NOT NULL,
  display_name  TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'student'
                            CHECK (role IN ('student','faculty')),
  year_of_study SMALLINT    CHECK (year_of_study BETWEEN 1 AND 4),
  semester      SMALLINT    CHECK (semester BETWEEN 1 AND 8),
  college_roll  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE        INDEX idx_users_role         ON users(role);

-- ═══════════════════════════════════════════════
-- QUERIES TABLE
-- ═══════════════════════════════════════════════
-- Updated provider CHECK per Live Model Verification (13 keys)
CREATE TABLE queries (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject               TEXT,
  year_of_study         SMALLINT    CHECK (year_of_study BETWEEN 1 AND 4),
  semester              SMALLINT    CHECK (semester BETWEEN 1 AND 8),
  mode                  TEXT        NOT NULL
                                    CHECK (mode IN ('code','error','concept','verilog','project','research')),
  controller            TEXT        CHECK (controller IN ('arduino','esp32','stm32','pic','fpga')),
  query_text            TEXT        NOT NULL CHECK (char_length(query_text) <= 1000),
  response_json         TEXT,
  provider              TEXT        CHECK (provider IN (
                                      'groq_70b','groq_8b','groq_qwen','groq_27b','groq_120b',
                                      'cerebras','cerebras_b',
                                      'sn_verilog','sn_research','sn_reserve',
                                      'gemini_p','gemini_f','gemini_lite'
                                    )),
  model                 TEXT,
  tokens_used           INTEGER     CHECK (tokens_used >= 0),
  latency_ms            INTEGER     CHECK (latency_ms >= 0),
  rating                SMALLINT    CHECK (rating BETWEEN 1 AND 5),
  session_id            TEXT        NOT NULL,
  topic_slug            TEXT,
  release_level         SMALLINT    DEFAULT 0,
  misconceptions_tagged TEXT[],
  engagement_delta      FLOAT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queries_user_id      ON queries(user_id);
CREATE INDEX idx_queries_mode         ON queries(mode);
CREATE INDEX idx_queries_subject      ON queries(subject);
CREATE INDEX idx_queries_provider     ON queries(provider);
CREATE INDEX idx_queries_year         ON queries(year_of_study);
CREATE INDEX idx_queries_topic_slug   ON queries(topic_slug);
CREATE INDEX idx_queries_created_at   ON queries(created_at DESC);

-- ═══════════════════════════════════════════════
-- SCANS TABLE
-- ═══════════════════════════════════════════════
CREATE TABLE scans (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_id         UUID        NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  image_path       TEXT        NOT NULL,
  context          TEXT        NOT NULL,
  student_question TEXT,
  response_json    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scans_user_id    ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- ═══════════════════════════════════════════════
-- SESSION ENGAGEMENT TABLE (rollup for Table B)
-- ═══════════════════════════════════════════════
CREATE TABLE session_engagement (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id),
  session_id      TEXT        NOT NULL,
  engagement_score FLOAT      NOT NULL DEFAULT 0,
  probe_count     INTEGER     DEFAULT 0,
  bypass_count    INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_session_engagement_user ON session_engagement(user_id);
CREATE INDEX idx_session_engagement_date ON session_engagement(created_at DESC);

-- ═══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_engagement ENABLE ROW LEVEL SECURITY;

-- users: each user reads only their own row
CREATE POLICY users_self_select ON users
  FOR SELECT USING (firebase_uid = (current_setting('request.jwt.claims',true)::json->>'sub'));

-- queries: student reads own, faculty reads all
CREATE POLICY queries_student_select ON queries FOR SELECT
  USING (
    user_id = (SELECT id FROM users
               WHERE firebase_uid = (current_setting('request.jwt.claims',true)::json->>'sub'))
  );
CREATE POLICY queries_faculty_select ON queries FOR SELECT
  USING (
    (SELECT role FROM users
     WHERE firebase_uid = (current_setting('request.jwt.claims',true)::json->>'sub')) = 'faculty'
  );

-- scans: same pattern as queries
CREATE POLICY scans_student_select ON scans FOR SELECT
  USING (
    user_id = (SELECT id FROM users
               WHERE firebase_uid = (current_setting('request.jwt.claims',true)::json->>'sub'))
  );
CREATE POLICY scans_faculty_select ON scans FOR SELECT
  USING (
    (SELECT role FROM users
     WHERE firebase_uid = (current_setting('request.jwt.claims',true)::json->>'sub')) = 'faculty'
  );

-- NOTE: All INSERT/UPDATE use service_role key server-side — bypasses RLS.
-- No INSERT policies needed.

-- ═══════════════════════════════════════════════
-- STORAGE BUCKET (run via Supabase Dashboard)
-- ═══════════════════════════════════════════════
-- Name:    scan-uploads
-- Public:  false
-- File size limit: 5 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Path format: {user_id}/{query_id}/{timestamp}.jpg
