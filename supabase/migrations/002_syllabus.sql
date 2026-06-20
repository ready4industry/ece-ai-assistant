-- ECE AI Assistant — Syllabus Schema
-- Migration 002: syllabus_topics table + pgvector + match_topic() function
-- Run ONCE via Supabase SQL Editor. Enable pgvector extension first.
-- Supabase Dashboard → Database → Extensions → search 'vector' → Enable

-- ═══════════════════════════════════════════════
-- ENABLE PGVECTOR (if not already enabled)
-- ═══════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════
-- SYLLABUS TOPICS TABLE
-- ═══════════════════════════════════════════════
CREATE TABLE syllabus_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year            SMALLINT NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester        SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  subject         TEXT NOT NULL,
  subject_label   TEXT NOT NULL,
  topic           TEXT NOT NULL,
  topic_slug      TEXT NOT NULL UNIQUE,
  description     TEXT,
  prerequisites   TEXT[],
  keywords        TEXT[],
  complexity      SMALLINT CHECK (complexity BETWEEN 1 AND 10),
  co_po_mapping   TEXT[],
  embedding       vector(3072),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_syllabus_year      ON syllabus_topics(year);
CREATE INDEX idx_syllabus_subject   ON syllabus_topics(subject);
CREATE INDEX idx_syllabus_slug      ON syllabus_topics(topic_slug);
CREATE INDEX idx_syllabus_embedding ON syllabus_topics
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════════
-- SIMILARITY SEARCH FUNCTION
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_topic(
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
