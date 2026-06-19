-- ECE AI Assistant — Table B Intelligence Engine Schema
-- Migration 003: probes, probe_responses, misconception tables, cohort, flags, etc.
-- Run AFTER migrations 001 and 002.

-- ═══════════════════════════════════════════════
-- PROBES TABLE (B2 — probe text shown to student)
-- ═══════════════════════════════════════════════
CREATE TABLE probes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT NOT NULL,
  user_id         UUID REFERENCES users(id),
  topic_slug      TEXT NOT NULL,
  template_used   TEXT,
  generated_text  TEXT NOT NULL,
  attempt_number  SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_probes_session   ON probes(session_id);
CREATE INDEX idx_probes_user      ON probes(user_id);
CREATE INDEX idx_probes_topic     ON probes(topic_slug);

-- ═══════════════════════════════════════════════
-- PROBE RESPONSES TABLE (B3)
-- ═══════════════════════════════════════════════
CREATE TABLE probe_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id         UUID REFERENCES probes(id),
  answer_text      TEXT,
  classification   TEXT CHECK (classification IN (
    'honest_confusion','irrelevant_genuine','surface_answer',
    'correct','partial','disengaged'
  )),
  relevance_score  FLOAT,
  overlap_ratio    FLOAT,
  word_count       INTEGER,
  entropy_score    FLOAT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_probe_responses_probe   ON probe_responses(probe_id);
CREATE INDEX idx_probe_responses_class   ON probe_responses(classification);

-- ═══════════════════════════════════════════════
-- MISCONCEPTION LOG (B6 — append-only verified)
-- ═══════════════════════════════════════════════
CREATE TABLE misconception_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  topic_slug      TEXT NOT NULL,
  misconception   TEXT NOT NULL,
  cluster_id      UUID,
  verified        BOOLEAN DEFAULT false,
  constitutional_critique TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_misconception_user    ON misconception_log(user_id);
CREATE INDEX idx_misconception_topic   ON misconception_log(topic_slug);
CREATE INDEX idx_misconception_cluster ON misconception_log(cluster_id);
CREATE INDEX idx_misconception_verified ON misconception_log(verified);

-- ═══════════════════════════════════════════════
-- MISCONCEPTION CLUSTERS (B7 — semantic clustering)
-- ═══════════════════════════════════════════════
CREATE TABLE misconception_clusters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_label TEXT NOT NULL,
  embedding       vector(768),
  topic_slug      TEXT,
  sample_count    INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_misconception_clusters_embedding ON misconception_clusters
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Match misconception to cluster function
CREATE OR REPLACE FUNCTION match_misconception_cluster(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.82,
  match_count     INT   DEFAULT 1
) RETURNS TABLE (id UUID, canonical_label TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.canonical_label,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM   misconception_clusters c
  WHERE  1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER  BY similarity DESC
  LIMIT  match_count;
END; $$;

-- ═══════════════════════════════════════════════
-- KNOWLEDGE SNAPSHOTS (B8/B9)
-- ═══════════════════════════════════════════════
CREATE TABLE knowledge_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  topic_slug  TEXT NOT NULL,
  week_number INT NOT NULL,
  state_json  JSONB NOT NULL,
  state_score FLOAT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_knowledge_user    ON knowledge_snapshots(user_id);
CREATE INDEX idx_knowledge_topic   ON knowledge_snapshots(topic_slug);
CREATE INDEX idx_knowledge_week    ON knowledge_snapshots(week_number);
CREATE UNIQUE INDEX idx_knowledge_unique ON knowledge_snapshots(user_id, topic_slug, week_number);

-- ═══════════════════════════════════════════════
-- PROGRESSION METRICS (B9)
-- ═══════════════════════════════════════════════
CREATE TABLE progression_metrics (
  user_id           UUID REFERENCES users(id),
  topic_slug        TEXT NOT NULL,
  week_number       INT NOT NULL,
  state_score       FLOAT,
  delta_from_prior  FLOAT,
  PRIMARY KEY (user_id, topic_slug, week_number)
);
CREATE INDEX idx_progression_user ON progression_metrics(user_id);

-- ═══════════════════════════════════════════════
-- COHORT ASSIGNMENTS (B10)
-- ═══════════════════════════════════════════════
CREATE TABLE cohort_assignments (
  user_id           UUID REFERENCES users(id),
  week_number       INT NOT NULL,
  cohort            TEXT CHECK (cohort IN ('remedial','developing','market_ready')),
  engagement_avg    FLOAT,
  persistence_score FLOAT,
  velocity_score    FLOAT,
  cohort_score      FLOAT,
  PRIMARY KEY (user_id, week_number)
);
CREATE INDEX idx_cohort_user ON cohort_assignments(user_id);
CREATE INDEX idx_cohort_week ON cohort_assignments(week_number);

-- ═══════════════════════════════════════════════
-- FACULTY FLAGS (B11)
-- ═══════════════════════════════════════════════
CREATE TABLE faculty_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  session_id    TEXT,
  topic_slug    TEXT,
  release_level SMALLINT,
  dismissed     BOOLEAN DEFAULT false,
  dismissed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_flags_user      ON faculty_flags(user_id);
CREATE INDEX idx_flags_dismissed ON faculty_flags(dismissed);
CREATE INDEX idx_flags_created   ON faculty_flags(created_at DESC);

-- ═══════════════════════════════════════════════
-- CO-PO EVIDENCE LOG (B12)
-- ═══════════════════════════════════════════════
CREATE TABLE co_po_evidence_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  topic_slug  TEXT NOT NULL,
  co_po_tags  TEXT[],
  verified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_co_po_user    ON co_po_evidence_log(user_id);
CREATE INDEX idx_co_po_topic   ON co_po_evidence_log(topic_slug);
CREATE INDEX idx_co_po_verified ON co_po_evidence_log(verified);

-- ═══════════════════════════════════════════════
-- REMEDIAL PLANS (B13)
-- ═══════════════════════════════════════════════
CREATE TABLE remedial_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  generated_at   TIMESTAMPTZ DEFAULT now(),
  plan_json      JSONB NOT NULL,
  strategy_used  TEXT
);
CREATE INDEX idx_remedial_user ON remedial_plans(user_id);

-- ═══════════════════════════════════════════════
-- DAILY ENGAGEMENT SUMMARY (B5 cron output)
-- ═══════════════════════════════════════════════
CREATE TABLE daily_engagement_summary (
  date            DATE PRIMARY KEY,
  total_sessions  INTEGER DEFAULT 0,
  bypass_count    INTEGER DEFAULT 0,
  bypass_rate     FLOAT DEFAULT 0,
  avg_engagement  FLOAT DEFAULT 0
);

-- ═══════════════════════════════════════════════
-- ERROR LOG (for /api/admin/debug/last-errors)
-- ═══════════════════════════════════════════════
CREATE TABLE error_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  TEXT NOT NULL,
  stage       TEXT NOT NULL,
  provider    TEXT,
  error_type  TEXT,
  error_msg   TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_error_log_stage    ON error_log(stage);
CREATE INDEX idx_error_log_provider ON error_log(provider);
CREATE INDEX idx_error_log_created  ON error_log(created_at DESC);
