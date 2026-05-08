export type Role = "admin" | "agent" | "developer" | "user";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Property {
  id: string;
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
  created_at: string;
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
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  created_at: string;
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
  bio: string;
  specializations: string[];
  cities: string[];
  areas: string[];
  primary_city: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
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
  id: number;
  property_id: number | null;
  document_type: string;
  status: string;
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

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
