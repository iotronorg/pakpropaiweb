export type Role = "admin" | "agent" | "developer" | "user";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
  last_active: string | null;
  ntn: string | null;
  cnic: string | null;
  is_filer: boolean;
}


export interface PropertyImage {
  id: string;
  image: string;
  caption: string;
  order: number;
  created_at: string;
}

export interface Property {
  id: string;
  owner: string | null;
  owner_phone: string | null;
  title: string;
  description: string;
  city: string;
  location: string;
  area_marla: number | null;
  price_pkr: number | null;
  property_type: string;
  construction_status: string | null;
  furnished_status: string | null;
  legal_status: "unverified" | "verified" | "disputed" | "pending";
  ai_score: number | null;
  risk_level: "low" | "medium" | "high" | null;
  assigned_agent: number | null;
  is_active: boolean;
  installment_available: boolean;
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
  location_interest: string | null;
  intent_score: number | null;
  status: string;
  intent: string | null;
  notes: string;
  assigned_agent_id: number | null;
  assigned_agent_name: string | null;
  created_at: string;
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
  document_type: string;
  document_name: string | null;
  sender_phone: string;
  extracted_fields: Record<string, unknown>;
  red_flags: string[];
  confidence: number | null;
  raw_ocr: string;
  whatsapp_summary: string;
  scan_status: string;
  property_id: string | null;
  verification_id: string | null;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  property_id: string | null;
  document_type: string;
  status: "pending" | "approved" | "rejected" | "needs_info";
  signal_score: number | null;
  fraud_flags: string[];
  notes: string;
  risk_level: string | null;
  summary: string | null;
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
  // Payment control
  active_payment_gateway: "safepay" | "bsecure" | "manual";
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
  scraper_search_enabled: string;
  // Computed
  setup_complete: boolean;
  missing_required: string[];
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

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
