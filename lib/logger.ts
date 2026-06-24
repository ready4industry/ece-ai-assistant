// /lib/logger.ts — structured logging utility
// Every log includes request_id, stage, timestamp, status

// Wide string so new route stages don't require enum updates
export type LogStage = string;

export type LogStatus = 'success' | 'failure' | 'fallback' | 'skip' | 'warn' | 'critical';

export interface LogEntry {
  request_id: string;
  stage:      LogStage;
  status:     LogStatus;
  timestamp:  string;
  provider?:  string;
  model?:     string;
  error_type?: string;
  error_msg?:  string;
  details?:    Record<string, unknown>;
}

class Logger {
  private formatEntry(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  }

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const full: LogEntry = { ...entry, timestamp: new Date().toISOString() };
    if (entry.status === 'critical') {
      // Writes to stderr with a distinctive prefix so Vercel log drain / grep alerts fire
      console.error('[ECE-CRITICAL]', this.formatEntry(full));
    } else if (entry.status === 'failure') {
      console.error('[ECE]', this.formatEntry(full));
    } else if (entry.status === 'warn' || entry.status === 'fallback') {
      console.warn('[ECE]', this.formatEntry(full));
    } else {
      console.log('[ECE]', this.formatEntry(full));
    }
    // In production, errors are also written to Supabase error_log
    // via persistError() called from API routes that need it
  }

  success(request_id: string, stage: LogStage, details?: Record<string, unknown>): void {
    this.log({ request_id, stage, status: 'success', details });
  }

  failure(
    request_id: string,
    stage: LogStage,
    error: Error | unknown,
    details?: Record<string, unknown>
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log({
      request_id,
      stage,
      status: 'failure',
      error_type: err.name,
      error_msg:  err.message,
      details,
    });
  }

  critical(
    request_id: string,
    stage: LogStage,
    provider: string,
    error: Error | unknown,
    details?: Record<string, unknown>
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log({
      request_id,
      stage,
      status: 'critical',
      provider,
      error_type: 'CRITICAL_AUTH_FAILURE',
      error_msg:  err.message,
      details,
    });
  }

  fallback(
    request_id: string,
    stage: LogStage,
    provider: string,
    reason: string,
    nextProvider?: string
  ): void {
    this.log({
      request_id,
      stage,
      status: 'fallback',
      provider,
      details: { reason, next_provider: nextProvider ?? 'exhausted' },
    });
  }

  modelCall(
    request_id: string,
    provider: string,
    model: string,
    status: LogStatus,
    details?: Record<string, unknown>
  ): void {
    this.log({ request_id, stage: 'model_call', status, provider, model, details });
  }
}

export const logger = new Logger();

// Persist error to Supabase for /api/admin/debug/last-errors endpoint
export async function persistError(entry: Omit<LogEntry, 'timestamp'>, payload?: unknown) {
  try {
    const { supabase } = await import('./supabase');
    await supabase.from('error_log').insert({
      request_id: entry.request_id,
      stage:      entry.stage,
      provider:   entry.provider ?? null,
      error_type: entry.error_type ?? null,
      error_msg:  entry.error_msg ?? null,
      payload:    payload ?? null,
    });
  } catch {
    // Swallow — logging must never crash the app
  }
}
