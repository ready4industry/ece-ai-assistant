# ECE Lab Pro — User Manual

This manual covers both user profiles: **Student** and **Faculty**. Each section describes every feature, its purpose, and step-by-step instructions for using it.

---

## Student Profile

### 1. ECE Assistant — main chat `/assistant`

**Purpose:** Your primary learning interface. Ask any ECE question and get a guided, syllabus-aware answer. The assistant tracks your level and silently adapts: if you copy-paste without reading, it will challenge you with a Socratic probe before continuing.

**How to use:**

1. **Set your year** — Y1 through Y4. Responses are calibrated to your year's syllabus and complexity expectations.
2. **Pick a mode** — see the six modes below. Mode determines how the AI frames its response.
3. If you chose **Code mode**, a controller selector appears — pick the platform your code targets (Arduino, ESP32, STM32, PIC, or FPGA).
4. **Type your question** in the input bar (up to 1000 characters) and press Enter or click Send.
5. If a **Socratic probe** appears instead of an answer, the system detected low engagement. Type a genuine answer in the probe box and press Reply — your original question will then be answered.
6. Rate the response 1–5 stars using the stars below each answer. Ratings help improve routing.

**The six modes:**

| Mode | Use it for |
|------|------------|
| **Explain** | Theory, concepts, definitions, derivations |
| **Code** | Write, review, or complete embedded code |
| **Debug** | Paste an error message or broken code |
| **Verilog** | RTL design, testbenches, FPGA synthesis |
| **Project** | Design planning and feasibility |
| **Research** | Papers, literature review, methodology |

> **Note:** Responses show a **Guided Mode (Level N)** badge when the AI is deliberately withholding part of the answer to promote thinking. This is intentional — the full answer unlocks once you engage.

---

### 2. Circuit Scanner `/scanner`

**Purpose:** Upload a photo of a circuit schematic, breadboard layout, oscilloscope waveform, or handwritten lab diagram and get an AI analysis — component identification, signal interpretation, or error detection.

**How to use:**

1. **Set your year** so the analysis uses year-appropriate vocabulary and expected circuits.
2. **Upload your image** — drag and drop or click to browse. Accepted formats: JPEG, PNG, WebP. Maximum 5 MB.
3. Wait for the Gemini Vision model to process the image. The analysis appears below with a thumbnail of your upload.
4. Read the analysis. Each scan is stored in your history and linked to your session.

> **Tip:** Works best on clear, well-lit photos. If handwriting is involved, print legibly. The AI describes what it sees, then interprets it in ECE context.

---

### 3. Project Advisor `/project`

**Purpose:** A focused chat dedicated to project design — mini-project proposals, semester projects, and final-year projects. Separate from the main assistant so project conversations don't mix with conceptual queries.

**How to use:**

1. **Set your year** — defaults to Y4 since most project work is final year, but adjust if needed.
2. **Describe your project idea** or ask a design question: *"Design a smart irrigation system using ESP32 with soil moisture sensors"* or *"What are the hardware blocks I need for a line-following robot?"*
3. Continue the conversation to drill into specific sub-systems, component selection, or circuit design.

> **Tip:** Use this for planning and ideation. Use the main Assistant (`/assistant`) in Code mode when you're ready to write actual firmware.

---

### 4. Research Assistant `/research`

**Purpose:** Helps you understand academic papers, structure literature reviews, identify research gaps, and learn about research methodology in ECE. Routed to models optimised for long-form academic reasoning (SambaNova research model).

**How to use:**

1. **Set your year** — Y3/Y4 are typical but any year can use this.
2. Ask about a paper, topic area, or methodology: *"Summarise the key contributions of GaN-based power amplifier research in the last 5 years"* or *"What is the difference between ANOVA and t-test for signal processing experiments?"*
3. Use follow-up questions to go deeper into specific claims, techniques, or citation strategies.

---

### 5. Query History `/history`

**Purpose:** A paginated log of every question you have asked and every answer you received. Use it to revisit explanations, check which AI provider answered, and see your past star ratings.

**How to use:**

1. The page loads your most recent queries automatically. Each row shows the mode icon, truncated question, provider, date, and your star rating (if given).
2. **Click any row** to expand and read the full response.
3. Use **Previous / Next** at the bottom to page through older entries (20 per page).

**Mode icons in history:**

`Code` · `Debug` · `Explain` · `Verilog` · `Project` · `Research` · `Scan`

---

### 6. Knowledge Progress `/progress`

**Purpose:** Shows your mastery score (0–100%) for each syllabus topic, computed weekly from how you respond to Socratic probes. The more probes you answer honestly, the more granular this view becomes.

**How to use:**

1. Each topic you have been probed on appears as a row with a colour-coded progress bar.
2. Scores are recomputed every Sunday at 22:00 IST by the progression cron job.
3. If the page shows "no data yet" you have not answered enough probes — answer them in the main assistant to populate this view.

**Score colours:**

| Range | Colour | Meaning |
|-------|--------|---------|
| 75–100% | Green | Strong |
| 50–74% | Yellow | Developing |
| 25–49% | Orange | Needs work |
| 0–24% | Red | At risk |

---

### What is a Socratic probe? *(auto-triggered)*

**Purpose:** Sometimes, instead of answering your question directly, the system pauses and asks you a question first. This is a Socratic probe — a check to verify you are actually engaging with the material and not just collecting answers.

**How it works:**

1. A probe is triggered when the system detects signals of low engagement: very short queries, repeated pasting of assignment text, or keyword-echo patterns (you use exact words from the answer in your next question).
2. The probe appears in a distinct panel with a small indicator dot. It asks a targeted conceptual question related to your topic.
3. **Type your genuine answer** and press Reply or Enter. There is no "correct" answer in the traditional sense — the system evaluates authenticity and relevance, not correctness.
4. After you reply, your original question is answered normally.

> **Warning:** Typing random text or one-word dismissals will be classified as "disengaged" and logged for your faculty to review. Genuine partial answers — even *"I'm not sure but I think it relates to X"* — are scored positively.

---

---

## Faculty Profile *(restricted access)*

Faculty access is granted by the system administrator based on your email address. The Faculty Dashboard is available at `/faculty` after sign-in.

---

### 1. Live Classroom tab `/faculty → Live Classroom`

**Purpose:** Real-time overview of what your class is doing right now. Opens automatically when you log in. Use this during or after a lecture to see which modes students are using, which topics are generating confusion, and whether any students need intervention.

**Four stat cards (top row):**

1. **Active Students Today** — count of unique students who submitted at least one query in the last 24 hours.
2. **Queries (24h)** — total queries across all modes in the last 24 hours.
3. **Open Flags** — count of unresolved disengagement or bypass alerts. Shown in red if any exist.
4. **Topics in Confusion** — count of topics where students responded "honest_confusion" to a probe.

**Queries by mode panel:**

1. Bar chart showing how many queries each mode (Concept, Code, Debug, Verilog, Project, Research, Scan) received in 24 hours. Sorted high to low.
2. Click **Refresh** (top-right of panel) to reload all dashboard data without leaving the page.

**Socratic Probe Monitor:**

1. Ranked list of topics where probe responses were classified as "honest_confusion" — the student genuinely did not know, not disengaged.
2. The #1 ranked topic is highlighted in red. Use this to decide what to re-explain in your next class.

**Open flags panel:**

1. Appears only if flags exist. Each flag shows the reason, flag type, and timestamp.
2. Flag types include **bypass** (student tried to skip a probe) and **disengagement** (low engagement score sustained over a session).
3. Student identity is shown by internal ID only — cross-reference with your enrolment list if you need to follow up individually.

---

### 2. Cohort Intelligence tab `/faculty → Cohort Intelligence`

**Purpose:** Weekly-computed learning analytics. Classifies every student into a performance tier based on their probe score averages across all topics. Also shows semantically-clustered misconceptions — groups of students who share the same wrong mental model.

**Cohort tiers:**

| Tier | Score | What to do |
|------|-------|------------|
| **Advanced** | ≥75% avg | Students mastering topics above expectations. Consider giving them extended problems. |
| **On Track** | 50–74% | Progressing normally. Monitor for slips in harder topics. |
| **Needs Support** | 25–49% | Below average. Consider targeted revision materials or extra tutorials. |
| **At Risk** | below 25% | Critically low. Direct intervention recommended before exam period. |

**Misconception clusters:**

1. Each cluster is a group of students who expressed the same incorrect understanding in their probe responses. Similarity is computed via vector embeddings — no manual tagging needed.
2. Each card shows: cluster label (the AI's name for the misconception), example text, and student count.
3. Top 3 clusters are highlighted in red — address these first in remediation.
4. Clusters are recomputed every Saturday at 22:00 IST.

**Low engagement alert:**

1. Appears if any students fall below the engagement threshold across their sessions.
2. Shows up to 10 students (by year badge and anonymised ID). The full list is in the database.

---

### 3. Syllabus Manager tab `/faculty → Syllabus Manager`

**Purpose:** Browse and manage all 62 ECE syllabus topics across Years 1–4. The primary action here is seeding embeddings — this must be run once after deployment before the AI can do topic-matched retrieval.

**How to use:**

1. **Search** by topic name or subject name using the text field. Results filter live as you type.
2. **Filter by year** using the Y1–Y4 buttons. Click the same year again to deselect.
3. Each row shows: topic name, topic slug (machine identifier), subject, year badge, complexity rating (1–10), and CO-PO mapping codes.
4. **Seed All Embeddings** (top-right button) — runs once after deployment. Sends all 62 topics through the Gemini Embedding API and stores the vectors in the database. Takes 30–60 seconds due to rate limiting. Shows "Seeded N/62" result when done.

> **Tip:** Seeding is idempotent — rows with existing embeddings are skipped automatically. You can safely click the button again if a previous run was interrupted.

**Complexity scale:**

| Range | Level |
|-------|-------|
| 1–2 | Introductory |
| 3–4 | Foundational |
| 5–6 | Intermediate |
| 7–8 | Advanced |
| 9–10 | Expert |

---

### 4. Probe Studio tab `/faculty → Probe Studio`

**Purpose:** Generate Socratic probe questions on demand for any syllabus topic and any query type. Use these for class discussions, tutorials, assignment questions, or to audit what kinds of probes your students receive.

**How to use:**

1. **Select a topic** from the dropdown — topics are grouped by year. The dropdown shows complexity rating alongside each topic name.
2. Once a topic is selected, a preview panel shows its **prerequisites** and **CO-PO mapping codes** — useful for checking alignment.
3. **Select a query intent** — this tells the probe generator what kind of student query to simulate, so the probe targets the right cognitive level.
4. Click **Generate Socratic Probe**. The AI generates a question designed to reveal whether a student truly understands the concept vs. just recognising keywords.
5. Click **Copy** (top-right of the result panel) to copy the probe text to your clipboard.

**Six intent types:**

- **Concept Explanation** — student asked "what is X"
- **Code Request** — student asked for code
- **Error Analysis** — student pasted an error
- **Verilog Review** — student asked about RTL
- **Derivation** — student asked for a proof or formula
- **Design Request** — student asked how to build something

> **Tip:** Generated probes are the same type students receive automatically in the assistant. Running a few here helps you understand what your students experience and lets you spot-check probe quality for a topic you are about to teach.

---

### 5. Research Output tab — NBA evidence `/faculty → Research Output`

**Purpose:** Exports CO-PO attainment evidence for NBA accreditation submissions. Every student interaction is tagged with Course Outcome (CO) and Programme Outcome (PO) codes derived from the syllabus topic mapping. This tab aggregates and visualises those interaction counts.

**How to use:**

1. **Choose a year filter** (All / Y1 / Y2 / Y3 / Y4) to scope the evidence report to a specific cohort year.
2. Click **Export NBA Evidence**. The system queries all logged CO-PO interactions and returns attainment counts for each CO and PO code.
3. The **CO Attainment** panel shows a horizontal bar chart — each CO code with its total interaction count (how many times students engaged with topics mapped to that CO).
4. The **PO Attainment** panel shows the same for PO codes (PO1–PO12).
5. The **Topic Mastery Overview** panel (always visible) shows class-average probe scores per topic as a ranked list with colour-coded bars — useful for identifying which syllabus areas are weakest across the cohort.
6. A footer shows the total evidence record count and export timestamp for audit trail purposes.

> **Note:** CO-PO attainment counts reflect interaction volume, not exam marks. Use them as supporting evidence alongside traditional assessment data, not as a primary measure of attainment.

> **Warning:** Topic Mastery Overview shows "Progression data computed weekly" until the first Sunday cron run completes. Export NBA Evidence works from interaction logs and is available immediately after students start using the system.

---

## Quick Reference

### Student features

| Feature | URL | When to use |
|---------|-----|-------------|
| ECE Assistant | `/assistant` | All ECE questions — concepts, code, debugging, Verilog |
| Circuit Scanner | `/scanner` | Upload circuit photos or diagrams for AI analysis |
| Project Advisor | `/project` | Plan and design mini-projects or final-year projects |
| Research Assistant | `/research` | Papers, literature reviews, research methodology |
| Query History | `/history` | Revisit past answers and check ratings |
| Knowledge Progress | `/progress` | Track mastery scores across syllabus topics |

### Faculty features

| Feature | URL | When to use |
|---------|-----|-------------|
| Live Classroom | `/faculty` | During/after lectures — real-time engagement snapshot |
| Cohort Intelligence | `/faculty` | Weekly review — tier analysis and misconception clusters |
| Syllabus Manager | `/faculty` | One-time setup (seed embeddings); browse topic metadata |
| Probe Studio | `/faculty` | Generate probes for class use or quality-checking |
| Research Output | `/faculty` | NBA accreditation exports and CO-PO attainment reports |

### Cron schedule (automated background jobs)

| Job | Schedule | Purpose |
|-----|----------|---------|
| Misconception clustering | Saturdays 22:00 IST | Groups similar probe responses into clusters |
| Progression scoring | Sundays 22:00 IST | Recomputes student mastery scores |
| Cohort assignment | Mondays 07:00 IST | Updates tier assignments (Advanced / On Track / etc.) |
| Engagement summary | Daily 23:30 IST | Aggregates daily engagement stats |
| Flag sweep | Daily 06:00 IST | Closes stale flags and archives old data |
