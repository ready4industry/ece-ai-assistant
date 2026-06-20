// /app/api/cron/cluster-misconceptions/route.ts
// Vercel Cron: weekly on Saturday 22:00 IST (16:30 UTC)
// Clusters verified misconceptions using pgvector cosine similarity via match_misconception_cluster()

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI }        from '@google/generative-ai';
import { supabase }                  from '@/lib/supabase';
import { logger }                    from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log({ request_id: requestId, stage: 'cron_cluster_misconceptions', status: 'success', details: { step: 'started' } });

  // Fetch all unembedded verified misconceptions
  const { data: misconceptions } = await supabase
    .from('misconception_log')
    .select('id, misconception, topic_slug')
    .eq('verified', true)
    .is('embedding', null)
    .limit(200);

  if (!misconceptions?.length) {
    logger.log({ request_id: requestId, stage: 'cron_cluster_misconceptions', status: 'success',
      details: { step: 'nothing_to_embed' } });
    return NextResponse.json({ embedded: 0, clustered: 0 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model  = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

  let embedded  = 0;
  let clustered = 0;
  let failed    = 0;

  for (const row of misconceptions) {
    try {
      // outputDimensionality is a valid API param not yet in SDK types (v0.21.0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { embedding } = await model.embedContent({ content: { parts: [{ text: row.misconception }], role: 'user' }, outputDimensionality: 1536 } as any);
      const embVec        = embedding.values;

      // Update the misconception_log row with its embedding
      await supabase.from('misconception_log').update({ embedding: embVec }).eq('id', row.id);
      embedded++;

      // Find nearest cluster via pgvector RPC
      const { data: nearestCluster } = await supabase.rpc('match_misconception_cluster', {
        query_embedding: embVec,
        match_threshold: 0.85,
        match_count:     1,
      });

      if (nearestCluster?.[0]) {
        // Assign to existing cluster
        await supabase.from('misconception_log').update({
          cluster_id: nearestCluster[0].id,
        }).eq('id', row.id);

        await supabase.from('misconception_clusters').update({
          member_count: nearestCluster[0].member_count + 1,
        }).eq('id', nearestCluster[0].id);
        clustered++;
      } else {
        // Create new cluster
        const { data: newCluster } = await supabase.from('misconception_clusters').insert({
          cluster_label:      row.misconception.slice(0, 80),
          top_misconception:  row.misconception,
          topic_slug:         row.topic_slug ?? '',
          embedding:          embVec,
          member_count:       1,
        }).select('id').single();

        if (newCluster) {
          await supabase.from('misconception_log').update({
            cluster_id: newCluster.id,
          }).eq('id', row.id);
          clustered++;
        }
      }

      // Stay within Gemini embedding rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      failed++;
      logger.failure(requestId, 'cron_cluster_misconceptions', err, { misconception_id: row.id });
    }
  }

  logger.success(requestId, 'cron_cluster_misconceptions', { embedded, clustered, failed });
  return NextResponse.json({ embedded, clustered, failed, total: misconceptions.length });
}
