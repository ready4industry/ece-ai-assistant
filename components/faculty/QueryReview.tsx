'use client';

/** The client never loads student prompts; a future server-only audit feed may populate this view. */
export function QueryReview() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Restricted faculty workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-on-surface">Student Query Review</h2>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">Review tools are limited to authorized faculty. Student prompts are never loaded into student-facing views.</p>
        </div>
        <span className="w-fit rounded-md bg-secondary-container px-3 py-1.5 text-xs font-semibold text-on-secondary-container">Faculty access verified</span>
      </div>
      <div className="stitch-card grid gap-4 p-5 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Secure review feed</p>
          <h3 className="mt-2 text-lg font-semibold text-on-surface">No client-side query feed is configured</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">This protected workspace is ready for a server-authorized audit feed. It deliberately does not request or render student prompt content until such a faculty-only endpoint exists.</p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-surface-container-low p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Privacy guard</p>
          <p className="mt-2 font-mono text-xs leading-5 text-primary">role = faculty<br />scope = private_audit<br />student_access = denied</p>
        </div>
      </div>
    </section>
  );
}
