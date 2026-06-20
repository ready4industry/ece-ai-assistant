-- ECE AI Assistant — Fix embedding dimensions: vector(768) → vector(3072)
-- Migration 004: gemini-embedding-2 returns 3072 dimensions, not 768.
-- Also adds missing misconception_log.embedding column (present in code, absent from 003 schema).
--
-- Safe to run on a live DB: all embedding columns are currently NULL
-- (seeding failed before this fix). The DROP COLUMN only removes the embedding
-- column — all other row data (slugs, topics, years, etc.) is preserved.
-- Run AFTER migrations 001, 002, 003.

-- ═══════════════════════════════════════════════════════════════════
-- syllabus_topics: drop vector(768) column, re-add as vector(3072)
-- ═══════════════════════════════════════════════════════════════════
DROP INDEX  IF EXISTS idx_syllabus_embedding;
ALTER TABLE syllabus_topics DROP COLUMN IF EXISTS embedding;
ALTER TABLE syllabus_topics ADD  COLUMN embedding vector(3072);

CREATE INDEX idx_syllabus_embedding ON syllabus_topics
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════════════════════════════
-- match_topic(): recreate with vector(3072) parameter
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS match_topic(vector, smallint, float8, int4);

CREATE FUNCTION match_topic(
  query_embedding vector(3072),
  match_year      SMALLINT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count     INT   DEFAULT 3
) RETURNS TABLE (
  topic TEXT, subject TEXT, subject_label TEXT,
  year SMALLINT, complexity SMALLINT,
  prerequisites TEXT[], similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT s.topic, s.subject, s.subject_label,
         s.year, s.complexity, s.prerequisites,
         1 - (s.embedding <=> query_embedding) AS similarity
  FROM   syllabus_topics s
  WHERE  s.year = match_year
  AND    1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER  BY similarity DESC
  LIMIT  match_count;
END; $$;

-- ═══════════════════════════════════════════════════════════════════
-- misconception_clusters: drop vector(768) column, re-add as vector(3072)
-- ═══════════════════════════════════════════════════════════════════
DROP INDEX  IF EXISTS idx_misconception_clusters_embedding;
ALTER TABLE misconception_clusters DROP COLUMN IF EXISTS embedding;
ALTER TABLE misconception_clusters ADD  COLUMN embedding vector(3072);

CREATE INDEX idx_misconception_clusters_embedding ON misconception_clusters
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ═══════════════════════════════════════════════════════════════════
-- match_misconception_cluster(): recreate with vector(3072) parameter
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS match_misconception_cluster(vector, float8, int4);

CREATE FUNCTION match_misconception_cluster(
  query_embedding vector(3072),
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

-- ═══════════════════════════════════════════════════════════════════
-- misconception_log: add missing embedding column
-- The cluster-misconceptions cron embeds each misconception before
-- clustering it; this column was absent from migration 003.
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE misconception_log
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

CREATE INDEX IF NOT EXISTS idx_misconception_log_embedding ON misconception_log
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
