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
  id: number;
  phone: string;
  name: string | null;
  budget_min: number | null;
  budget_max: number | null;
  location_interest: string | null;
  intent_score: number | null;
  status: string;
  created_at: string;
  agent_id: number | null;
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

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
