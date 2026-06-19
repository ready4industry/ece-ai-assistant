// /app/api/admin/seed-syllabus/route.ts — One-time seeder: embeddings for all 62 topics
// Protected by x-admin-secret header

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI }        from '@google/generative-ai';
import { supabase }                  from '@/lib/supabase';
import { SYLLABUS }                  from '@/lib/syllabus-data';
import { logger }                    from '@/lib/logger';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const adminSecret = req.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    logger.log({ request_id: requestId, stage: 'admin_seed', status: 'warn', details: { reason: 'invalid_secret' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model  = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

  const results = { success: 0, failed: 0, skipped: 0 };
  const errors: string[] = [];

  for (const topic of SYLLABUS) {
    try {
      // Check if already exists to avoid re-embedding
      const { data: existing } = await supabase
        .from('syllabus_topics')
        .select('id')
        .eq('topic_slug', topic.topic_slug)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      // Generate embedding from topic + description + keywords
      const embeddingInput = `${topic.topic}. ${topic.description}. Keywords: ${topic.keywords.join(', ')}.`;
      const { embedding }  = await model.embedContent(embeddingInput);

      const { error } = await supabase.from('syllabus_topics').insert({
        year:           topic.year,
        semester:       topic.semester,
        subject:        topic.subject,
        subject_label:  topic.subject_label,
        topic:          topic.topic,
        topic_slug:     topic.topic_slug,
        description:    topic.description,
        prerequisites:  topic.prerequisites,
        keywords:       topic.keywords,
        complexity:     topic.complexity,
        co_po_mapping:  topic.co_po_mapping,
        embedding:      embedding.values,
      });

      if (error) {
        errors.push(`${topic.topic_slug}: ${error.message}`);
        results.failed++;
      } else {
        results.success++;
        logger.log({ request_id: requestId, stage: 'admin_seed', status: 'success',
          details: { slug: topic.topic_slug, step: 'inserted' } });
      }

      // Rate limit: 2 embeddings/second
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      errors.push(`${topic.topic_slug}: ${String(err)}`);
      results.failed++;
      logger.failure(requestId, 'admin_seed', err, { slug: topic.topic_slug });
    }
  }

  logger.success(requestId, 'admin_seed', { ...results, error_count: errors.length });

  return NextResponse.json({
    success:  results.success,
    failed:   results.failed,
    skipped:  results.skipped,
    total:    SYLLABUS.length,
    errors:   errors.slice(0, 20),
  });
}
