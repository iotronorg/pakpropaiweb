export type Role = "admin" | "agent" | "developer" | "client";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string;
  role: Role;
  is_active: boolean;
  is_phone_verified: boolean;
  date_joined: string;
  last_active: string | null;
  ntn: string | null;
  cnic: string | null;
  is_filer: boolean;
}


export interface PropertyImage {
  id: string;
  url: string;
  caption: string;
  order: number;
  created_at: string;
}

export interface Property {
  id: string;
  ref_no: string;
  owner: string | null;
  owner_phone: string | null;
  title: string;
  description: string;
  city: string;
  location: string;
  area_marla: number | null;
  area_unit: string;
  area_sqm: number | null;
  price: number | null;
  property_type: string;
  construction_status: string | null;
  furnished_status: string | null;
  legal_status: "unverified" | "verified" | "disputed" | "pending";
  ai_score: number | null;
  risk_level: "low" | "medium" | "high" | null;
  assigned_agent: number | null;
  is_active: boolean;
  installment_available: boolean;
  ai_analysis: Record<string, unknown> | null;
  primary_image: string | null;
  images: PropertyImage[];
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string | null;
  location_interest: string | null;
  intent_score: number | null;
  status: string;
  priority: string | null;
  routing_state: string | null;
  intent: string | null;
  notes: string;
  source: "whatsapp" | "web" | "manual" | null;
  intent_signals: Record<string, unknown> | null;
  score_factors: {
    intent: number;
    budget: number;
    location: number;
    engagement: number;
    recency: number;
    total: number;
  } | null;
  organization: string;
  assigned_agent_id: number | null;
  assigned_agent_name: string | null;
  last_contacted_at: string | null;
  created_at: string;
  wa_session_id?: string | null;
}

export interface LeadStats {
  hot_leads: number;
  unassigned: number;
  avg_score: number | null;
  new_today: number;
}

export interface ConversationMessage {
  id: string;
  direction: "inbound" | "outbound";
  channel: "whatsapp" | "dashboard";
  body: string;
  sender_phone: string | null;
  sender_name: string | null;
  wa_message_id: string;
  created_at: string;
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  lead: string;
  lead_phone: string;
  lead_name: string | null;
  property: string | null;
  property_title: string | null;
  agent: number | null;
  agent_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string;
  reminder_sent_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type DealLockStatus = "initiated" | "locked" | "released" | "cancelled" | "disputed" | "expired";

export interface DealLock {
  id: string;
  property: string;
  property_title: string;
  property_city: string;
  buyer_phone: string;
  seller_phone: string | null;
  agent_name: string | null;
  token_amount: number;
  currency: string;
  status: DealLockStatus;
  payment_gateway: string;
  payment_ref: string;
  initiated_via: string;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  lock_started_at: string | null;
  lock_expires_at: string | null;
  hours_remaining: number | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  name: string;
  phone: string;
  cities: string[];
  specializations: string[];
  is_verified: boolean;
  is_active: boolean;
  rating: number | null;
  created_at: string;
}

export interface AgentProfile {
  id: number;
  name: string;
  agent_type: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  company_name: string;
  designation: string;
  years_experience: number;
  bio: string;
  specializations: string[];
  cities: string[];
  areas: string[];
  primary_city: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  availability_status: 'available' | 'busy' | 'offline';
  registration_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  total_leads: number;
  total_listings: number;
  closed_deals: number;
  rating: number | null;
  user_phone: string | null;
  user_email: string | null;
  parent_organization: number | null;
  parent_organization_name: string | null;
  joined_at: string;
  updated_at: string;
}

export interface DocumentScan {
  id: number;
  submitter_phone: string;
  document_type: string;
  owner_name: string | null;
  cnic_number: string | null;
  property_address: string | null;
  area: string | null;
  authority: string | null;
  confidence: number | null;
  status: string;
  red_flag_count: number;
  red_flags: string[];
  whatsapp_summary: string;
  verification: number | null;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  status: "pending" | "approved" | "rejected" | "needs_info";
  signal_score: number | null;
  property_id: string | null;
  property_title: string | null;
  property_city: string | null;
  requester_phone: string | null;
  reviewer_phone: string | null;
  document_count: number;
  total_red_flags: number;
  document_types: string[];
  fraud_flags: string[];
  notes: string;
  verified_at: string | null;
  created_at: string;
}

export interface AuditReport {
  id: number;
  property_id: number;
  risk_score: number;
  ownership_status: string;
  legal_flags: string[];
  market_comparison: string;
  created_at: string;
}

export interface StatsOverview {
  total_properties: number;
  verified_properties: number;
  total_leads: number;
  active_agents: number;
  scam_checks_today: number;
  audits_generated: number;
}

export interface Payment {
  id: string;
  user: string;
  amount_pkr: number;
  purpose: string;
  gateway: string;
  status: "pending" | "completed" | "failed" | "refunded";
  reference: string;
  checkout_url: string;
  deal_id: string | null;
  created_at: string;
}

export interface SystemConfig {
  // Non-sensitive (actual values returned)
  wa_phone_number_id: string;
  wa_verify_token: string;
  wa_otp_template_name: string;
  gemini_model: string;
  ai_backend: string;
  base_url: string;
  safepay_environment: string;
  bsecure_environment: string;
  // Sensitive — backend returns "__configured__" if set, "" if not
  wa_access_token: string;
  wa_app_secret: string;
  gemini_api_key: string;
  safepay_merchant_key: string;
  safepay_secret_key: string;
  bsecure_client_id: string;
  bsecure_client_secret: string;
  // Deal-lock payment gateway (org-to-client payments)
  active_payment_gateway: "safepay" | "bsecure" | "manual";
  // SaaS billing gateway (org plan upgrades)
  billing_gateway: "stripe" | "safepay" | "bsecure" | "manual";
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  stripe_price_basic: string;
  stripe_price_professional: string;
  stripe_price_enterprise: string;
  billing_price_basic_pkr: string;
  billing_price_professional_pkr: string;
  billing_price_enterprise_pkr: string;
  // Feature toggles ("true" | "false" strings)
  feature_property_search: string;
  feature_property_listing: string;
  feature_tax_advice: string;
  feature_loan_eligibility: string;
  feature_scam_check: string;
  feature_document_verification: string;
  feature_property_audit: string;
  feature_talk_to_agent: string;
  feature_deal_lock: string;
  feature_voice_messages: string;
  feature_follow_up_automation: string;
  feature_auto_assign: string;
  scraper_search_enabled: string;
  // Computed
  setup_complete: boolean;
  missing_required: string[];
}

export interface OrgPaymentSettings {
  gateway?: "safepay" | "bsecure" | "manual";
  safepay_merchant_key?: string;
  safepay_secret_key?: string;
  safepay_environment?: "sandbox" | "production";
  bsecure_client_id?: string;
  bsecure_client_secret?: string;
  bsecure_environment?: "sandbox" | "production";
  jazzcash_number?: string;
  easypaisa_number?: string;
  bank_account_number?: string;
  bank_account_name?: string;
}

export type ReportType = "property_analysis" | "tax_advisory" | "loan_eligibility" | "fraud_check";
export type ReportStatus = "pending" | "generating" | "ready" | "failed";

export interface Report {
  id: string;
  report_type: ReportType;
  status: ReportStatus;
  file_url: string | null;
  created_at: string;
  ready_at: string | null;
}

export interface TrustCertificate {
  property_id: string;
  certificate_url: string;
  verified_at: string | null;
  signal_score: number | null;
}

export interface MonthlyReport {
  id: string;
  organization: string;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  pdf_url: string | null;
  created_at: string;
  ready_at: string | null;
}

export interface Notification {
  id: string;
  title: string;
  channel: "whatsapp" | "sms" | "email";
  message: string;
  status: "pending" | "sent" | "failed" | "delivered";
  is_read: boolean;
  created_at: string;
  sent_at: string | null;
}

export interface UserNotificationPreference {
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  lead_updates: boolean;
  appointment_reminders: boolean;
  deal_updates: boolean;
  report_ready: boolean;
  marketing: boolean;
  updated_at: string;
}

export interface MarketTrend {
  period: string;
  avg_price: number | null;
  listing_count: number;
}

export interface LeadScoreHistory {
  id: number;
  old_score: number;
  new_score: number;
  reason: string;
  created_at: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

// ── Organization Dashboard ─────────────────────────────────────────────────────

export interface OrgDashboardStats {
  leads: {
    total: number;
    hot: number;
    new_this_week: number;
    routing_queue: number;
    by_status: Record<string, number>;
    by_intent: Record<string, number>;
  };
  agents: {
    active: number;
    pending: number;
  };
  inventory: {
    total: number;
    verified: number;
    avg_ai_score: number;
    by_type: Record<string, number>;
  };
}

export interface OrgAIConversation {
  lead_id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_score: number;
  lead_status: string;
  message_preview: string;
  channel: string;
  created_at: string;
}

export interface OrgAIStats {
  summary: {
    total_leads: number;
    hot_leads: number;
    routing_queue: number;
    agent_assigned: number;
    qualified_leads: number;
    new_this_week: number;
    leads_with_convos: number;
    chat_success_rate: number;
  };
  recent_conversations: OrgAIConversation[];
}

export interface AgentPerformanceRow {
  id: number;
  name: string;
  phone: string;
  is_verified: boolean;
  total_leads: number;
  closed_leads: number;
  closed_deals: number;
  rating: number;
  primary_city: string;
}

export interface LeadReportData {
  total: number;
  avg_score: number;
  hot_leads: number;
  by_status: Record<string, number>;
  by_intent: Record<string, number>;
  by_source: Record<string, number>;
  trend?: { period: string; count: number }[];
}

export interface PropertyReportData {
  total: number;
  avg_ai_score: number;
  installment_available: number;
  by_type: Record<string, number>;
  by_legal_status: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_city: Record<string, number>;
  trend?: { period: string; count: number }[];
}

export interface AgentReportData {
  count: number;
  results: AgentPerformanceRow[];
}

export interface DealReportData {
  total_locks: number;
  completed: number;
  expired: number;
  disputed: number;
  avg_confirm_hours: number | null;
  by_status: Record<string, number>;
  by_gateway: Record<string, number>;
}

// ── BI Analytics ─────────────────────────────────────────────────────────────

export interface FunnelStage {
  stage: string;
  count: number;
  conversion: number;
}

export interface FunnelData {
  stages: FunnelStage[];
  total_leads: number;
  overall_conversion: number;
}

export interface WaTokenMonth {
  period: string;
  tokens: number;
}

export interface WaTokenData {
  monthly: WaTokenMonth[];
  current_period: string;
  current_month: number;
  total_6m: number;
}

export interface SpeedLeaderboardEntry {
  rank: number;
  agent_id: number;
  name: string;
  avg_response_time_hours: number | null;
  closed_deals: number;
  rating: number;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
export interface BillingDimension {
  used: number;
  limit: number | null;
}

export interface BillingUsage {
  plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  usage: {
    agents: BillingDimension;
    inventory: BillingDimension;
    wa_tokens: BillingDimension & { period: string };
  };
}

export interface BillingInvoice {
  id: string;
  number: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export type CampaignAudienceFilter =
  | 'all' | 'new' | 'warm' | 'qualified' | 'cold'
  | 'buy' | 'sell' | 'rent' | 'invest';

export interface Campaign {
  id: string;
  name: string;
  message_template: string;
  audience_filter: CampaignAudienceFilter;
  meta_template_name: string | null;
  meta_template_language: string;
  meta_template_components: object[];
  messaging_tier: 1 | 2 | 3;
  budget_min: number | null;
  budget_max: number | null;
  area_interest: string | null;
  scheduled_at: string | null;
  status: CampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaTemplate {
  name: string;
  language: string;
  category: string;
  body_preview: string;
  components: object[];
}

export interface CampaignProgress {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  pct_complete: number;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  plan: "trial" | "basic" | "professional" | "enterprise";
  country: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  is_verified: boolean;
  admin_phone: string | null;
  agent_count: number;
  lead_count: number;
  property_count: number;
  created_at: string;
}

export interface AdminOrganizationDetail extends AdminOrganization {
  address: string;
  language: string;
  measurement_system: string;
  brand_color: string | null;
  logo: string | null;
  admin_user: string | null;
  admin_name: string | null;
  updated_at: string;
}

export interface OrgMembership {
  id: string;
  user_phone: string;
  user_name: string | null;
  role: 'owner' | 'org_admin' | 'team_manager' | 'sales_manager' |
        'crm_operator' | 'agent' | 'freelance_agent' | 'viewer';
  employment_type: 'internal' | 'freelance';
  is_active: boolean;
  joined_at: string;
}

export interface InviteMemberPayload {
  phone: string;
  role: OrgMembership['role'];
  employment_type: OrgMembership['employment_type'];
}

// ── Platform Admin Sub-roles ───────────────────────────────────────────────
export interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  platform_role: 'super_admin' | 'ops_admin' | 'ai_admin' |
                 'compliance_admin' | 'billing_admin' | 'support_admin' | null;
}

export interface OrgWhatsAppConfig {
  phone_number_id: string;
  display_phone: string;
  access_token: string;       // '••••••••' when set
  app_id: string;
  app_secret: string;         // '••••••••' when set
  verify_token: string;       // '••••••••' when set
  is_active: boolean;
  webhook_verified_at: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  otp_template_name: string;
  waba_id: string;
  // Directory discovery fields
  directory_keywords: string[];
  category_tags: string[];
  localized_greeting: string;
  support_hours: Record<string, { open: string; close: string; closed: boolean }>;
  meta_profile_synced_at: string | null;
}

// ── feature_talk_to_agent ──────────────────────────────────────────────────

export type ConversationMode = 'AI_MANAGED' | 'AGENT_MANAGED'

export interface WhatsAppMessagePayload {
  type: string
  text?: { body: string }
  audio?: { id: string; mime_type: string }
  image?: { id: string; mime_type: string; caption?: string }
  document?: { id: string; mime_type: string; filename?: string; caption?: string }
}

export interface AgentRoomEvent {
  type: 'agent_message' | 'connected' | 'pong'
  event?: 'inbound_message' | 'session_taken' | 'session_released' | 'session_reverted'
  session_id?: string
  phone?: string
  message?: WhatsAppMessagePayload
  msg_type?: string
  agent_id?: string
  agent_name?: string
  timestamp?: string
  lead_id?: string
  held_by?: string
  released_by?: string
  active_sessions?: Array<{ session_id: string; phone: string }>
}

export interface TakeControlResponse {
  conversation_mode: ConversationMode
  lock_ttl: number
}

export interface AgentStats {
  agent_id: number;
  name: string;
  availability_status: "available" | "busy" | "offline";
  total_leads: number;
  closed_leads: number;
  conversion_rate: number;
  closed_deals: number;
  avg_response_time_hours: number | null;
  rating: number;
  is_verified: boolean;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  trend?: { period: string; count: number }[];
}

export interface AgentLeaderboardEntry {
  rank: number;
  agent_id: number;
  name: string;
  total_leads: number;
  conversion_rate: number;
  avg_response_time_hours: number | null;
  closed_deals: number;
  rating: number;
}

export interface OpsMetrics {
  error_distribution: Record<string, number>;
  dlq_depth: number;
  p99_latencies: Record<string, number>;
  active_connections: {
    websocket: number;
    celery_workers: number;
    redis: number;
    postgres: number;
  };
  as_of: string;
}

export interface TraceStats {
  route: string;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  sample_count: number;
}

export interface PrivacyAuditLogEntry {
  id: string;
  action: 'pii_detected' | 'erasure_initiated' | 'erasure_completed' | 'consent_change' | 'export_generated' | 'data_transfer_checked';
  actor_id: string | null;
  subject_identifier: string;
  jurisdiction: string;
  regulation: string;
  details: Record<string, unknown>;
  is_sensitive: boolean;
  created_at: string;
}

export interface RTBFRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  regulation: string | null;
  request_source: 'manual' | 'api' | 'automated';
  requested_at: string;
  completed_at: string | null;
  erasure_scope: Record<string, unknown> | null;
}

export type PIIDetectionSummary = Record<string, number>;

export interface JurisdictionStatus {
  org_id: string;
  regulations: string[];
  data_residency_region: string;
  transfer_restrictions: string[];
}

export interface TokenUsageStats {
  total_tokens_in: number;
  total_tokens_out: number;
  total_calls: number;
  cache_hits: number;
  cache_hit_rate: number;
  estimated_usd_cost: number;
  estimated_savings_usd: number;
}

export interface TokenBudgetStatus {
  used: number;
  limit: number;
  percent: number;
  state: 'ok' | 'warning' | 'throttled' | 'hard_limit';
}

export interface ComplianceSanctionRecord {
  id: string;
  name: string;
  id_number_prefix: string;
  id_type: string;
  list_source: string;
  risk_level: 'high' | 'medium' | 'low';
  org_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SanctionScreeningResult {
  screening_id: string;
  screened_name: string;
  id_number_prefix: string;
  list_source: string;
  match_type: string;
  risk_score: number;
  deal_lock_id: string | null;
  org_id: string | null;
  status: 'clear' | 'flagged' | 'blocked';
  screened_at: string;
}

export interface FBRTaxResult {
  country: string;
  supported: boolean;
  wht_amount: number;
  cgt_amount: number;
  effective_rate: number;
  breakdown: Record<string, unknown>;
}

export interface ComplianceStats {
  total_screenings: number;
  flagged: number;
  blocked: number;
  clear_rate: number;
}

export type ProvisioningMode = 'sandbox' | 'provisioning' | 'production' | 'failed';

export interface OrgProvisioningRecord {
  operational_mode: ProvisioningMode;
  last_step: string;
  error_detail: string;
  waba_verified_at: string | null;
  webhook_verified_at: string | null;
  templates_approved_at: string | null;
  data_migrated_at: string | null;
  sandbox_leads_migrated: number;
  sandbox_sessions_migrated: number;
  sandbox_properties_migrated: number;
  updated_at: string;
}

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';
export type ConflictResolution = 'internal_wins' | 'external_wins' | 'manual';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'paused';
export type InventoryPlatform = 'zameen' | 'propertyfinder' | 'bayut' | 'rightmove' | 'zillow' | 'custom';

export type FieldMapping = Record<string, string>;

export interface ExternalPlatformConnection {
  id: string;
  platform: InventoryPlatform;
  api_key: string;
  api_secret: string;
  base_url: string;
  is_active: boolean;
  sync_direction: SyncDirection;
  conflict_resolution: ConflictResolution;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  error_detail: string;
  field_mappings: FieldMapping;
  created_at: string;
}

export interface SyncConflictAlert {
  id: string;
  org: string;
  connection: string;
  property: string;
  external_delta: Record<string, unknown>;
  internal_state: Record<string, unknown>;
  resolution: 'pending' | 'internal_wins' | 'external_wins' | 'manual';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface WebhookDeliveryRecord {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  attempt_count: number;
  delivered_at: string | null;
  error_detail: string;
  created_at: string;
}

export type SyncLog = WebhookDeliveryRecord;

export interface ConnectionTestResult {
  status: 'connected' | 'error';
  detail: string;
}

// ── Co-Pilot ──────────────────────────────────────────────────────────────────
export type CopilotRecommendationType = 'inventory_card' | 'doc_link' | 'tax_sheet' | 'ai_response'

export interface CopilotInventoryCard {
  property_id:   string
  title:         string
  bedrooms:      number | null
  price:         number | null
  currency:      string
  area_sqm:      number | null
  thumbnail_url: string | null
}

export interface CopilotTaxSheet {
  wht_amount:    number
  cgt_amount:    number
  effective_rate: number
  breakdown:     Record<string, number>
}

export interface CopilotAIResponse {
  suggested_reply: string
  confidence:      number
}

export interface CopilotDocLink {
  document_id: string
  title:       string
  url:         string
  doc_type:    string
}

export interface CopilotRecommendation {
  id:                  string
  recommendation_type: CopilotRecommendationType
  content:             CopilotInventoryCard | CopilotTaxSheet | CopilotAIResponse | CopilotDocLink
  created_at:          string
}

// ── Circuit Breaker / SLA ─────────────────────────────────────────────────────
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitInfo {
  state: CircuitState
  error_rate: number
  is_open: boolean
  updated_at: string
}

export interface SlaStatus {
  circuits: Record<string, CircuitState>
  outages: Record<string, { is_open: boolean; error_rate: number; updated_at: string }>
  queue_isolation: { isolated_orgs: string[]; total_monitored: number }
  as_of: string
}

export interface OrgTheme {
  primary_color:   string
  secondary_color: string
  accent_color:    string
  logo_url:        string
  updated_at:      string | null
}
