// /lib/types.ts — single source of truth for all TypeScript types
// AIProvider uses 13-key union from Live Model Verification (overrides Spec §3)

export type UserRole       = 'student' | 'faculty';
export type ControllerType = 'arduino' | 'esp32' | 'stm32' | 'pic' | 'fpga';
export type QueryMode      = 'code' | 'error' | 'concept' | 'verilog' | 'project' | 'research';
export type ScanMode       = 'circuit' | 'waveform' | 'logic_diagram' | 'pcb' | 'observation';
export type YearOfStudy    = 1 | 2 | 3 | 4;

// 13 provider keys — Live Model Verification §10 Step 2
export type AIProvider =
  | 'groq_70b'    // llama-3.3-70b-versatile
  | 'groq_8b'     // llama-3.1-8b-instant
  | 'groq_qwen'   // qwen/qwen3-32b
  | 'groq_27b'    // qwen/qwen3.6-27b
  | 'groq_120b'   // openai/gpt-oss-120b
  | 'cerebras'    // gpt-oss-120b
  | 'cerebras_b'  // zai-glm-4.7
  | 'sn_verilog'  // gpt-oss-120b on SambaNova
  | 'sn_research' // DeepSeek-V3.1
  | 'sn_reserve'  // Meta-Llama-3.3-70B-Instruct (3K out — last resort)
  | 'gemini_p'    // gemini-3.5-flash
  | 'gemini_f'    // gemini-2.5-flash
  | 'gemini_lite'; // gemini-3.1-flash-lite

export type IntentType =
  | 'definition' | 'code_request' | 'error_analysis' | 'concept_explanation'
  | 'verilog_review' | 'derivation' | 'design_request' | 'image_analysis'
  | 'project_help' | 'research_help' | 'follow_up' | 'acknowledgement' | 'noise';

export type CognitiveOp =
  | 'recall' | 'classification' | 'application' | 'analysis' | 'synthesis' | 'evaluation';

export type SocraticStage =
  | 'initial_probe' | 'awaiting_answer' | 'answer_received'
  | 'prerequisite_drop' | 'graduated_release' | 'complete';

export type EngagementState =
  | 'honest_confusion' | 'irrelevant_genuine' | 'surface_answer'
  | 'correct' | 'partial' | 'disengaged';

// ── Database row types ──────────────────────────────────────────────────────
export interface DBUser {
  id:            string;
  firebase_uid:  string;
  email:         string;
  display_name:  string;
  role:          UserRole;
  year_of_study: YearOfStudy | null;
  semester:      number | null;
  college_roll:  string | null;
  created_at:    string;
  last_seen_at:  string;
}

export interface DBQuery {
  id:                    string;
  user_id:               string;
  subject:               string | null;
  year_of_study:         YearOfStudy | null;
  semester:              number | null;
  mode:                  QueryMode;
  controller:            ControllerType | null;
  query_text:            string;
  response_json:         string | null;
  provider:              AIProvider | null;
  model:                 string | null;
  tokens_used:           number | null;
  latency_ms:            number | null;
  rating:                number | null;
  session_id:            string;
  topic_slug:            string | null;
  release_level:         number;
  misconceptions_tagged: string[] | null;
  engagement_delta:      number | null;
  created_at:            string;
}

export interface DBScan {
  id:               string;
  user_id:          string;
  query_id:         string;
  image_path:       string;
  context:          string;
  student_question: string | null;
  response_json:    string | null;
  created_at:       string;
}

// ── API request / response types ────────────────────────────────────────────
export interface GenerateRequest {
  query:         string;
  mode:          QueryMode;
  controller?:   ControllerType;
  subject?:      string;
  year:          YearOfStudy;          // matches what frontend sends
  session_id?:   string;
  probe_answer?: string | null;
}

export interface GenerateResponse {
  query_id:         string;
  provider:         AIProvider;
  model:            string;
  latency_ms:       number;
  tokens_used:      number;
  probe?:           string;       // Socratic probe if applicable
  probe_id?:        string;
  code?:            string;
  circuit?:         CircuitPin[];
  explanation?:     string;
  common_mistakes?: string;
  error_type?:      string;
  what_went_wrong?: string;
  how_to_fix?:      string;
  why_it_happens?:  string;
  response?:        string;
}

export interface CircuitPin {
  pin:         string;
  description: string;
}

export interface ScanRequest {
  image:            File;
  context:          string;
  scan_mode:        ScanMode;
  year_of_study:    YearOfStudy;
  student_question: string;
  session_id:       string;
}

export interface ScanResponse {
  query_id:        string;
  scan_id:         string;
  what_i_see:      string;
  analysis:        string;
  expected_values: string;
  mistakes_found:  string;
  suggestions:     string;
  viva_questions:  string[];
}

export interface RateRequest {
  query_id: string;
  rating:   1 | 2 | 3 | 4 | 5;
}

export interface HistoryResponse {
  queries:       DBQuery[];
  scans:         (DBScan & { image_signed_url: string })[];
  total_queries: number;
  total_scans:   number;
}

export interface DashboardResponse {
  total_queries:          number;
  total_scans:            number;
  weekly_active_students: number;
  avg_rating:             number;
  provider_breakdown:     Record<AIProvider, number>;
  controller_breakdown:   Record<ControllerType, number>;
  subject_breakdown:      { subject: string; count: number }[];
  year_breakdown:         Record<YearOfStudy, number>;
  daily_query_counts:     { date: string; count: number }[];
  top_topics:             { topic: string; count: number }[];
  avg_engagement_score:   number;
  probe_bypass_rate:      number;
  flags:                  FacultyFlag[];
  cohort_distribution:    { cohort: string; count: number }[];
}

export interface FacultyFlag {
  id:            string;
  user_id:       string;
  user_name?:    string;
  session_id:    string | null;
  topic_slug:    string | null;
  release_level: number | null;
  dismissed:     boolean;
  created_at:    string;
}

// ── AI router internal types ────────────────────────────────────────────────
export interface RouterResult {
  text:        string;
  provider:    AIProvider;
  model:       string;
  latency_ms:  number;
  tokens_used: number;
}

// ── Prompt engine types ─────────────────────────────────────────────────────
export interface PromptPacket {
  student_year:         YearOfStudy;
  subject:              string;
  topic_matched:        string;
  topic_slug:           string;
  prerequisites:        string[];
  complexity_score:     number;
  intent:               IntentType;
  cognitive_op:         CognitiveOp;
  has_image:            boolean;
  has_code_paste:       boolean;
  has_error_paste:      boolean;
  socratic_stage:       SocraticStage;
  probe_pending:        boolean;
  probe_template:       string | null;
  engagement_score:     number;
  release_level:        0 | 1 | 2 | 3 | 4;
  correct_concepts:     string[];
  misconceptions:       string[];
  prior_attempt:        string | null;
  probe_answer:         string | null;
  probe_answer_quality: 'none' | 'surface' | 'partial' | 'correct';
  recommended_model:    AIProvider;
  fallback_models:      AIProvider[];
  max_tokens:           number;
  raw_query:            string;
  session_history:      string;
}

// ── Session state (Redis) ───────────────────────────────────────────────────
export interface SessionState {
  session_id:        string;
  user_id:           string;
  year:              YearOfStudy;
  engagement_score:  number;
  probe_count:       number;
  disengage_count:   number;
  release_level:     0 | 1 | 2 | 3 | 4;
  pending_probe_id:  string | null;
  knowledge_map:     Record<string, 'gap' | 'partial' | 'correct'>;
  last_topic_slug:   string | null;
  last_activity:     number; // unix timestamp
}

// ── Syllabus types ──────────────────────────────────────────────────────────
export interface SyllabusTopic {
  year:          YearOfStudy;
  semester:      number;
  subject:       string;
  subject_label: string;
  topic:         string;
  topic_slug:    string;
  description:   string;
  prerequisites: string[];
  keywords:      string[];
  complexity:    number;
  co_po_mapping?: string[];
}
