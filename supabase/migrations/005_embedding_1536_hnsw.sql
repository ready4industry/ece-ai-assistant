-- ECE AI Assistant — Switch to vector(1536) + HNSW indexes
-- Migration 005: pgvector caps both ivfflat and hnsw at 2000 dimensions.
-- gemini-embedding-2 supports MRL truncation via outputDimensionality.
-- 1536 dims < 2000 limit, quality loss is negligible for ECE technical content.
--
-- Written defensively (DROP COLUMN IF EXISTS before ADD COLUMN) because
-- migration 004 failed mid-way: syllabus_topics.embedding may already be
-- vector(3072) with no index; other tables may be untouched.
-- Run AFTER migrations 001, 002, 003.

-- ═══════════════════════════════════════════════════════════════════
-- syllabus_topics
-- ═══════════════════════════════════════════════════════════════════
DROP INDEX  IF EXISTS idx_syllabus_embedding;
ALTER TABLE syllabus_topics DROP COLUMN IF EXISTS embedding;
ALTER TABLE syllabus_topics ADD  COLUMN embedding vector(1536);

CREATE INDEX idx_syllabus_embedding ON syllabus_topics
  USING hnsw (embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════════
-- match_topic(): rebuild with vector(1536)
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS match_topic(vector, smallint, float8, int4);

CREATE FUNCTION match_topic(
  query_embedding vector(1536),
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
-- misconception_clusters
-- ═══════════════════════════════════════════════════════════════════
DROP INDEX  IF EXISTS idx_misconception_clusters_embedding;
ALTER TABLE misconception_clusters DROP COLUMN IF EXISTS embedding;
ALTER TABLE misconception_clusters ADD  COLUMN embedding vector(1536);

CREATE INDEX idx_misconception_clusters_embedding ON misconception_clusters
  USING hnsw (embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════════
-- match_misconception_cluster(): rebuild with vector(1536)
-- ═══════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS match_misconception_cluster(vector, float8, int4);

CREATE FUNCTION match_misconception_cluster(
  query_embedding vector(1536),
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
-- misconception_log
-- ═══════════════════════════════════════════════════════════════════
DROP INDEX  IF EXISTS idx_misconception_log_embedding;
ALTER TABLE misconception_log DROP COLUMN IF EXISTS embedding;
ALTER TABLE misconception_log ADD  COLUMN embedding vector(1536);

CREATE INDEX idx_misconception_log_embedding ON misconception_log
  USING hnsw (embedding vector_cosine_ops);
