import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
// Server root — used for /public/* endpoints that sit outside /api/v1/
const SERVER_ROOT = BASE_URL.replace(/\/api\/v1\/?$/, "");

const MUTATING = new Set(["post", "put", "patch", "delete"]);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach CSRF token to every state-mutating request
api.interceptors.request.use((config) => {
  if (MUTATING.has((config.method ?? "").toLowerCase())) {
    const token = getCookie("csrftoken");
    if (token) config.headers["X-CSRFToken"] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/token/refresh/`, {}, { withCredentials: true });
        return api(original);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOtp = (phone: string, purpose = 'otp_login') =>
  api.post("/auth/otp/send/", { phone, purpose });

export const verifyOtp = (phone: string, code: string) =>
  api.post("/auth/otp/verify/", { phone, code });

export const loginWithPassword = (identifier: string, password: string) =>
  api.post("/auth/login/", { identifier, password });

export const verifyRegistrationOtp = (phone: string, code: string) =>
  api.post("/auth/registration/verify-otp/", { phone, code });

export const requestPasswordReset = (phone: string) =>
  api.post("/auth/password/reset/request/", { phone });

export const confirmPasswordReset = (phone: string, code: string, new_password: string) =>
  api.post("/auth/password/reset/confirm/", { phone, code, new_password });

export const changePassword = (current_password: string, new_password: string) =>
  api.post("/auth/password/change/", { current_password, new_password });

export const getMe = () => api.get("/auth/me/");
export const logout = () => api.post("/auth/logout/");

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = (role?: string, params?: Record<string, unknown>) =>
  api.get("/auth/users/", { params: { ...(role ? { role } : {}), ...params } });

export const getUser = (id: string) =>
  api.get(`/auth/users/${id}/`);

export const searchUsers = (query: string) =>
  api.get("/auth/users/", { params: { search: query } });

export const createUser = (data: Record<string, unknown>) =>
  api.post("/auth/users/", data);

export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.patch(`/auth/users/${id}/`, data);

export const deleteUser = (id: string) =>
  api.delete(`/auth/users/${id}/`);

// ── Leads ─────────────────────────────────────────────────────────────────────
export const getLeads = (params?: Record<string, unknown>) =>
  api.get("/leads/", { params });

export const getLead = (id: string) =>
  api.get(`/leads/${id}/`);

export const getLeadStats = () =>
  api.get("/leads/stats/");

export const updateLead = (id: string, data: Record<string, unknown>) =>
  api.patch(`/leads/${id}/`, data);

export const suggestAgentsForLead = (id: string) =>
  api.get(`/leads/${id}/suggest-agents/`);

export const assignAgentToLead = (id: string, agentId: number) =>
  api.post(`/leads/${id}/assign/`, { agent_id: agentId });

export const autoAssignLead = (id: string) =>
  api.post(`/leads/${id}/auto-assign/`);

export const getLeadConversations = (id: string) =>
  api.get(`/leads/${id}/conversations/`);

export const sendLeadMessage = (id: string, body: string) =>
  api.post(`/leads/${id}/send-message/`, { body });

export const getDuplicateLeads = () =>
  api.get("/leads/duplicates/");

export const summarizeLead = (id: string) =>
  api.post(`/leads/${id}/summarize/`);

export const suggestReplies = (id: string) =>
  api.post(`/leads/${id}/suggest-replies/`);

export const mergeLeads = (primary_id: string, secondary_id: string) =>
  api.post("/leads/merge/", { primary_id, secondary_id });

// ── Appointments ──────────────────────────────────────────────────────────────
export const getAppointments = (params?: Record<string, unknown>) =>
  api.get("/leads/appointments/", { params });

export const getAppointment = (id: string) =>
  api.get(`/leads/appointments/${id}/`);

export const createAppointment = (data: Record<string, unknown>) =>
  api.post("/leads/appointments/", data);

export const updateAppointment = (id: string, data: Record<string, unknown>) =>
  api.patch(`/leads/appointments/${id}/`, data);

export const confirmAppointment = (id: string) =>
  api.post(`/leads/appointments/${id}/confirm/`);

export const rescheduleAppointment = (id: string, scheduledAt: string) =>
  api.post(`/leads/appointments/${id}/reschedule/`, { scheduled_at: scheduledAt });

export const cancelAppointment = (id: string) =>
  api.post(`/leads/appointments/${id}/cancel/`);

export const completeAppointment = (id: string) =>
  api.post(`/leads/appointments/${id}/complete/`);

// ── Verification ──────────────────────────────────────────────────────────────
export const getVerificationQueue = (params?: Record<string, unknown>) =>
  api.get("/verification/queue/", { params });

export const reviewVerification = (id: string, data: { status: string; notes?: string }) =>
  api.patch(`/verification/queue/${id}/`, data);

export const getDocumentScans = (params?: Record<string, unknown>) =>
  api.get("/verification/documents/", { params });

export const getDocumentScan = (id: number) =>
  api.get(`/verification/documents/${id}/`);

export const linkDocumentToVerification = (scanId: number, verificationId: string) =>
  api.post(`/verification/documents/${scanId}/link/${verificationId}/`);

export const runFraudCheck = (query: string) =>
  api.post("/verification/fraud-check/", { query });

// ── Properties ────────────────────────────────────────────────────────────────
export const getProperties = (params?: Record<string, unknown>) =>
  api.get("/properties/", { params });

export const getMyProperties = (params?: Record<string, unknown>) =>
  api.get("/properties/mine/", { params });

export const getProperty = (id: string) =>
  api.get(`/properties/${id}/`);

export const createProperty = (data: Record<string, unknown>) =>
  api.post("/properties/", data);

export const updateProperty = (id: string, data: Record<string, unknown>) =>
  api.patch(`/properties/${id}/`, data);

export const deleteProperty = (id: string) =>
  api.delete(`/properties/${id}/`);

export const requestVerification = (id: string) =>
  api.post(`/properties/${id}/request_verification/`);

export const rescoreProperty = (id: string) =>
  api.post(`/properties/${id}/rescore/`);

export const rescoreAllProperties = () =>
  api.post("/properties/rescore-all/");

export const uploadPropertyImages = (id: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  return api.post(`/properties/${id}/upload-images/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePropertyImage = (propertyId: string, imageId: string) =>
  api.delete(`/properties/${propertyId}/images/${imageId}/`);

export const getRecommendedProperties = (leadId: string) =>
  api.get(`/properties/recommended/?lead=${leadId}`);

export const getSimilarProperties = (propertyId: string) =>
  api.get(`/properties/${propertyId}/similar/`);

// ── Audit ─────────────────────────────────────────────────────────────────────
export const getAudits = () =>
  api.get("/audit/");

export const downloadAudit = (id: number) =>
  api.get(`/audit/download/${id}/`, { responseType: "blob" });

// ── Audit Benchmarks ──────────────────────────────────────────────────────────
export const getBenchmarks = (city?: string) =>
  api.get("/audit/benchmarks/", { params: city ? { city } : {} });

export const createBenchmark = (data: Record<string, unknown>) =>
  api.post("/audit/benchmarks/", data);

export const updateBenchmark = (id: number, data: Record<string, unknown>) =>
  api.patch(`/audit/benchmarks/${id}/`, data);

export const deleteBenchmark = (id: number) =>
  api.delete(`/audit/benchmarks/${id}/`);

// System audit log (admin-only)
export const getAuditLog = (params?: Record<string, unknown>) =>
  api.get("/audit-log/", { params });

// ── Deal Locks ────────────────────────────────────────────────────────────────
export const getDealLocks = (params?: Record<string, unknown>) =>
  api.get("/deals/", { params });

export const getMyDealLocks = () =>
  api.get("/deals/mine/");

export const getDealLock = (id: string) =>
  api.get(`/deals/lock/${id}/`);

export const initiateDealLock = (data: {
  property_id: string;
  token_amount: number;
  payment_gateway: string;
}) => api.post("/deals/lock/", data);

export const confirmDealLock = (id: string, data: {
  payment_ref: string;
  payment_gateway?: string;
  admin_notes?: string;
}) => api.patch(`/deals/lock/${id}/confirm/`, data);

export const cancelDealLock = (id: string, reason?: string) =>
  api.patch(`/deals/lock/${id}/cancel/`, { reason });

// ── Payments ──────────────────────────────────────────────────────────────────
export const createCheckout = (dealId: string, gateway: "safepay" | "bsecure") =>
  api.post(`/payments/checkout/${dealId}/`, { gateway });

export const getPayments = () =>
  api.get("/payments/");

// ── Agents ────────────────────────────────────────────────────────────────────
export const getAgentProfile = () =>
  api.get("/agents/me/");

export const updateAgentProfile = (data: Record<string, unknown>) =>
  api.patch("/agents/me/", data);

export const updateAgentAvailability = (status: "available" | "busy" | "offline") =>
  api.patch("/agents/me/availability/", { availability_status: status });

export const getAvailableAgents = (city?: string) =>
  api.get("/agents/available/", { params: city ? { city } : {} });

export const getAgentsList = (params?: Record<string, unknown>) =>
  api.get("/agents/", { params });

export const createAgent = (data: Record<string, unknown>) =>
  api.post("/agents/", data);

export const updateAgent = (id: number, data: Record<string, unknown>) =>
  api.patch(`/agents/${id}/`, data);

export const deleteAgent = (id: number) =>
  api.delete(`/agents/${id}/`);

export const getPendingAgents = () =>
  api.get("/agents/", { params: { status: "pending" } });

const _publicApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

export const registerAgent = (data: Record<string, unknown>) =>
  _publicApi.post("/agents/register/", data);

export const registerOrganization = (data: Record<string, unknown>) =>
  _publicApi.post("/organizations/register/", data);

export const verifyOrgRegistrationOtp = (phone: string, code: string) =>
  _publicApi.post("/organizations/register/verify-otp/", { phone, code });

export const approveAgent = (id: number) =>
  api.post(`/agents/${id}/approve/`);

export const rejectAgent = (id: number, rejection_reason: string) =>
  api.post(`/agents/${id}/reject/`, { rejection_reason });

export const getAgentStats = (
  id: number,
  params?: { period?: "weekly" | "monthly" },
) => api.get(`/agents/${id}/stats/`, { params });

export const getAgentLeaderboard = () =>
  api.get<{ count: number; results: import("@/types").AgentLeaderboardEntry[] }>("/agents/leaderboard/");

// ── Agent Team (developer) ────────────────────────────────────────────────────
export const getTeam = () =>
  api.get("/agents/team/");

export const addTeamMember = (agentId: number) =>
  api.post("/agents/team/", { agent_id: agentId });

export const removeTeamMember = (agentId: number) =>
  api.delete(`/agents/team/${agentId}/`);

// ── Fraud Monitoring ──────────────────────────────────────────────────────────
export const getFraudStats = () =>
  api.get("/verification/fraud/stats/");

export const getFraudAlerts = (limit = 50) =>
  api.get("/verification/fraud/alerts/", { params: { limit } });

export const getFlaggedUsers = () =>
  api.get("/verification/fraud/users/");

export const getBlacklist = () =>
  api.get("/verification/fraud/blacklist/");

export const addBlacklistToken = (data: { token: string; reason: string; ttl_days?: number }) =>
  api.post("/verification/fraud/blacklist/", data);

export const removeBlacklistToken = (id: number) =>
  api.delete(`/verification/fraud/blacklist/${id}/`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const generateReport = (data: {
  report_type: "property_analysis" | "tax_advisory" | "loan_eligibility" | "fraud_check";
  property_id?: string;
  [key: string]: unknown;
}) => api.post("/reports/generate/", data);

export const getReport = (id: string) =>
  api.get(`/reports/${id}/`);

export const downloadReport = (id: string) =>
  api.get(`/reports/${id}/download/`, { responseType: "blob" });

export const getMyReports = () =>
  api.get("/reports/mine/");

export const getMonthlyReports = () =>
  api.get("/reports/monthly/");

export const getTrustCertificate = (propertyId: string) =>
  api.get(`/verification/${propertyId}/certificate/`);

export const getAgentPersonalReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/my-stats/", { params });

export const getLeadReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/leads/", { params });

export const getAgentReport = () =>
  api.get("/reports/agents/");

export const getPropertyReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/properties/", { params });

export const getDealReport = () =>
  api.get("/reports/deals/");

export const getRevenueReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/revenue/", { params });

export const getBotReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/bot/", { params });

export const getFunnelAnalytics = () =>
  api.get<import("@/types").FunnelData>("/reports/funnel/");

export const getWaTokenUsage = () =>
  api.get<import("@/types").WaTokenData>("/reports/wa-tokens/");

export const getSpeedLeaderboard = (top_n = 10) =>
  api.get<import("@/types").SpeedLeaderboardEntry[]>("/reports/leaderboard/", {
    params: { top_n },
  });

// ── Organization Dashboard ────────────────────────────────────────────────────
export const getOrgDashboard = () =>
  api.get("/organizations/me/dashboard/");

export const getOrgAIStats = () =>
  api.get("/organizations/me/ai-stats/");

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params?: Record<string, unknown>) =>
  api.get("/notifications/", { params });

export const markNotificationsRead = (ids?: string[]) =>
  api.post("/notifications/mark-read/", ids ? { ids } : {});

// ── Notification Preferences ──────────────────────────────────────────────────
export const getNotificationPreferences = () =>
  api.get("/auth/me/notification-preferences/");

export const updateNotificationPreferences = (data: Record<string, boolean>) =>
  api.patch("/auth/me/notification-preferences/", data);

// ── Property Compare & Market Trends ──────────────────────────────────────────
export const compareProperties = (ids: string[]) =>
  api.get("/properties/compare/", { params: { ids: ids.join(",") } });

export const getMarketTrends = (params?: { city?: string; period?: "monthly" | "weekly" }) =>
  api.get("/properties/market-trends/", { params });

// ── Bulk Operations ────────────────────────────────────────────────────────────
export const bulkAssignLeads = (lead_ids: string[], agent_id: number) =>
  api.post("/leads/bulk-assign/", { lead_ids, agent_id });

export const bulkRejectVerifications = (verification_ids: string[], notes?: string) =>
  api.post("/verification/bulk-reject/", { verification_ids, notes });

// ── Deal Lock — seller confirm / release / dispute ────────────────────────────
export const sellerConfirmDealLock = (id: string, token?: string) =>
  api.patch(`/deals/lock/${id}/seller-confirm/`, token ? { token } : {});

export const releaseDealLock = (id: string, adminNotes?: string) =>
  api.patch(`/deals/lock/${id}/release/`, adminNotes ? { admin_notes: adminNotes } : {});

export const disputeDealLock = (id: string, adminNotes?: string) =>
  api.patch(`/deals/lock/${id}/dispute/`, adminNotes ? { admin_notes: adminNotes } : {});

// ── Lead Activities & Score History ──────────────────────────────────────────
export const getLeadActivities = (id: string) =>
  api.get(`/leads/${id}/activities/`);

export const getLeadScoreHistory = (id: string) =>
  api.get(`/leads/${id}/score-history/`);

// ── System Config ─────────────────────────────────────────────────────────────
export const getConfig = () =>
  api.get("/config/").then((r) => r.data);

export const updateConfig = (data: Record<string, string>) =>
  api.patch("/config/", data).then((r) => r.data);

// ── Admin: Organizations ───────────────────────────────────────────────────────
export const getAdminOrgs = (params?: Record<string, unknown>) =>
  api.get("/organizations/", { params });

export const getAdminOrg = (id: string) =>
  api.get(`/organizations/${id}/`);

export const createOrg = (data: Record<string, unknown>) =>
  api.post("/organizations/", data);

export const updateOrg = (id: string, data: Record<string, unknown>) =>
  api.patch(`/organizations/${id}/`, data);

export const suspendOrg = (id: string) =>
  api.post(`/organizations/${id}/suspend/`);

export const activateOrg = (id: string) =>
  api.post(`/organizations/${id}/activate/`);

export const getAdminOrgConfig = (id: string) =>
  api.get(`/organizations/${id}/config/`).then((r) => r.data);

export const updateAdminOrgConfig = (id: string, data: Record<string, boolean>) =>
  api.patch(`/organizations/${id}/config/`, data).then((r) => r.data);

export const resetAdminOrgConfigKey = (id: string, key: string) =>
  api.delete(`/organizations/${id}/config/${key}/`).then((r) => r.data);

// ── Organization ──────────────────────────────────────────────────────────────
export const getMyOrganization = () =>
  api.get("/organizations/me/");

export const updateMyOrganization = (data: Record<string, unknown>) =>
  api.patch("/organizations/me/", data);

// ── Organization Feature Flags ────────────────────────────────────────────────
export const getOrgConfig = () =>
  api.get("/organizations/me/config/").then((r) => r.data);

export const updateOrgConfig = (data: Record<string, boolean>) =>
  api.patch("/organizations/me/config/", data).then((r) => r.data);

export const resetOrgConfigKey = (key: string) =>
  api.delete(`/organizations/me/config/${key}/`).then((r) => r.data);

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns = (params?: Record<string, unknown>) =>
  api.get("/campaigns/", { params });

export const getCampaign = (id: string) =>
  api.get(`/campaigns/${id}/`);

export const createCampaign = (data: Record<string, unknown>) =>
  api.post("/campaigns/", data);

export const updateCampaign = (id: string, data: Record<string, unknown>) =>
  api.patch(`/campaigns/${id}/`, data);

export const deleteCampaign = (id: string) =>
  api.delete(`/campaigns/${id}/`);

export const sendCampaign = (id: string) =>
  api.post(`/campaigns/${id}/send/`);

export const cancelCampaign = (id: string) =>
  api.post(`/campaigns/${id}/cancel/`);

export const scheduleCampaign = (id: string, scheduled_at: string) =>
  api.post(`/campaigns/${id}/schedule/`, { scheduled_at });

export const getCampaignTemplates = (): Promise<import("@/types").MetaTemplate[]> =>
  api.get("/campaigns/templates/").then(r => r.data);

export const getCampaignProgress = (id: string): Promise<import("@/types").CampaignProgress> =>
  api.get(`/campaigns/${id}/progress/`).then(r => r.data);

export const createCampaignFull = (data: {
  name: string;
  message_template?: string;
  audience_filter: import("@/types").CampaignAudienceFilter;
  meta_template_name?: string | null;
  meta_template_language?: string;
  meta_template_components?: object[];
  messaging_tier?: 1 | 2 | 3;
  budget_min?: number | null;
  budget_max?: number | null;
  area_interest?: string | null;
}): Promise<import("@/types").Campaign> =>
  api.post("/campaigns/", data).then(r => r.data);

// ── Billing ───────────────────────────────────────────────────────────────────
export const getBillingUsage = () =>
  api.get("/billing/usage/");

export const createBillingCheckout = (plan: string) =>
  api.post("/billing/checkout/", { plan });

export const getOrgPaymentSettings = () =>
  api.get("/billing/payment-settings/");

export const updateOrgPaymentSettings = (data: Record<string, string>) =>
  api.patch("/billing/payment-settings/", data);

export const getBillingPortal = () =>
  api.post("/billing/portal/").then((r) => r.data as { url: string });

export const getBillingInvoices = () =>
  api.get("/billing/invoices/").then((r) => r.data as { invoices: import("@/types").BillingInvoice[] });

// ── Organization Members ──────────────────────────────────────────────────
export const getOrgMembers = () =>
  api.get("/organizations/me/members/").then((r) => r.data as import("@/types").OrgMembership[]);

export const inviteOrgMember = (payload: import("@/types").InviteMemberPayload) =>
  api.post("/organizations/me/members/", payload).then((r) => r.data as import("@/types").OrgMembership);

export const removeOrgMember = (membershipId: string) =>
  api.delete(`/organizations/me/members/${membershipId}/`);

// ── Platform Admin Sub-roles ───────────────────────────────────────────────
export const getAdminUsers = (): Promise<import("@/types").AdminUser[]> =>
  api.get("/auth/users/?role=admin").then((r) => r.data);

export const updateAdminPlatformRole = (
  userId: string,
  platform_role: import("@/types").AdminUser['platform_role']
): Promise<import("@/types").AdminUser> =>
  api.patch(`/auth/users/${userId}/`, { platform_role }).then((r) => r.data);

// ── Freelance Agent ────────────────────────────────────────────────────────
export const createFreelanceProfile = (data: {
  license_number?: string;
}): Promise<{ id: string; verification_status: string }> =>
  api.post("/agents/freelance-profile/", data).then((r) => r.data);

// ── WhatsApp Integration Config ────────────────────────────────────────────
export const getWhatsAppConfig = (): Promise<import("@/types").OrgWhatsAppConfig> =>
  api.get("/whatsapp/config/").then((r) => r.data);

export const updateWhatsAppConfig = (
  data: Partial<import("@/types").OrgWhatsAppConfig>
): Promise<import("@/types").OrgWhatsAppConfig> =>
  api.patch("/whatsapp/config/", data).then((r) => r.data);

export const verifyWhatsAppConnection = (): Promise<{ ok: boolean; detail: string }> =>
  api.post("/whatsapp/config/verify/").then((r) => r.data);

export const sendWhatsAppTestMessage = (): Promise<{ ok: boolean }> =>
  api.post("/whatsapp/config/test-message/").then((r) => r.data);

export const syncWaProfile = (): Promise<{ status: string; synced_at: string | null }> =>
  api.post("/whatsapp/config/sync/").then((r) => r.data);

// ── feature_talk_to_agent ──────────────────────────────────────────────────

export const takeControl = (sessionId: string): Promise<import("@/types").TakeControlResponse> =>
  api.post(`/whatsapp/sessions/${sessionId}/take-control/`).then((r) => r.data);

export const releaseControl = (sessionId: string): Promise<{ conversation_mode: import("@/types").ConversationMode }> =>
  api.post(`/whatsapp/sessions/${sessionId}/release-control/`).then((r) => r.data);

// ── Observability ──────────────────────────────────────────────────────────

export const getOpsMetrics = (): Promise<import("@/types").OpsMetrics> =>
  api.get("/observability/metrics/").then((r) => r.data);

export const getTraceStats = (
  route: string,
  hours?: number
): Promise<import("@/types").TraceStats> =>
  api.get("/observability/traces/", { params: { route, hours } }).then((r) => r.data);

// ── Privacy compliance ─────────────────────────────────────────────────────

export const getPrivacyAuditLog = (params?: {
  action?: string;
  jurisdiction?: string;
}): Promise<import("@/types").PrivacyAuditLogEntry[]> =>
  api.get("/compliance/privacy-audit/", { params }).then((r) => r.data);

export const initiateRTBF = (
  phone_e164: string,
  reason: string
): Promise<{ request_id: string }> =>
  api.post("/compliance/rtbf/initiate/", { phone_e164, reason }).then((r) => r.data);

export const getRTBFStatus = (requestId: string): Promise<import("@/types").RTBFRequest> =>
  api.get(`/compliance/rtbf/${requestId}/`).then((r) => r.data);

export const exportPrivacyAudit = (orgId?: string): Promise<Blob> =>
  api
    .get("/compliance/privacy-audit/export/", {
      params: orgId ? { org: orgId } : undefined,
      responseType: "blob",
    })
    .then((r) => r.data);

export const getPIIDetectionSummary = (): Promise<import("@/types").PIIDetectionSummary> =>
  api.get("/compliance/pii-detections/summary/").then((r) => r.data);

// ── Token governance ──────────────────────────────────────────────────────────

export interface TokenUsageParams {
  org?: string;
  start?: string;
  end?: string;
  intent?: string;
  model?: string;
}

export const getTokenUsageStats = (params?: TokenUsageParams): Promise<import("@/types").TokenUsageStats> =>
  api.get("/ai/token-usage/", { params }).then((r) => r.data);

export const getTokenBudget = (orgId?: string): Promise<import("@/types").TokenBudgetStatus> =>
  api.get("/ai/token-budget/", { params: orgId ? { org: orgId } : undefined }).then((r) => r.data);

// ── Compliance / AML ──────────────────────────────────────────────────────────

export const getComplianceScreenings = (params?: { status?: string; date_from?: string }): Promise<import("@/types").SanctionScreeningResult[]> =>
  api.get("/compliance/screenings/", { params }).then((r) => r.data);

export const getComplianceSanctions = (): Promise<import("@/types").ComplianceSanctionRecord[]> =>
  api.get("/compliance/sanctions/").then((r) => r.data);

export const createComplianceSanction = (data: {
  name: string;
  id_number?: string;
  id_type?: string;
  list_source: string;
  risk_level: string;
}): Promise<{ id: string }> =>
  api.post("/compliance/sanctions/", data).then((r) => r.data);

export const deleteComplianceSanction = (id: string): Promise<void> =>
  api.delete(`/compliance/sanctions/${id}/`).then((r) => r.data);

export const exportComplianceReport = (orgId?: string): Promise<Blob> =>
  api.get("/compliance/screenings/export/", {
    params: orgId ? { org: orgId } : undefined,
    responseType: "blob",
  }).then((r) => r.data);

// ── Public (unauthenticated) viral referral endpoints ────────────────────────

const _viralApi = axios.create({
  baseURL: SERVER_ROOT,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

export interface PublicPlatformStats {
  total_verifications: number;
  scams_caught: number;
  active_orgs: number;
  leads_generated_today: number;
}

export interface ReferralConvertResult {
  org_whatsapp_number: string;
  org_slug: string;
}

export const getPublicPlatformStats = (): Promise<PublicPlatformStats> =>
  _viralApi.get("/public/platform-stats/").then((r) => r.data);

export const submitReferralConversion = (data: {
  ref: string;
  phone: string;
  source?: string;
}): Promise<ReferralConvertResult> =>
  _viralApi.post("/public/referral/convert/", data).then((r) => r.data);

// Provisioning
import type { OrgProvisioningRecord } from "@/types";

export const getProvisioningStatus = (): Promise<OrgProvisioningRecord> =>
  api.get("/api/v1/provisioning/status/").then((r) => r.data);

export const startProvisioning = (): Promise<{ detail: string }> =>
  api.post("/api/v1/provisioning/start/").then((r) => r.data);

export const retryProvisioning = (): Promise<{ detail: string }> =>
  api.post("/api/v1/provisioning/retry/").then((r) => r.data);

// Inventory integrations
import type {
  ExternalPlatformConnection,
  SyncConflictAlert,
  WebhookDeliveryRecord,
  ConnectionTestResult,
} from "@/types";

export const getConnections = (): Promise<ExternalPlatformConnection[]> =>
  api.get("/api/v1/inventory/connections/").then((r) => r.data.results ?? r.data);

export const createConnection = (
  data: Partial<ExternalPlatformConnection>
): Promise<ExternalPlatformConnection> =>
  api.post("/api/v1/inventory/connections/", data).then((r) => r.data);

export const updateConnection = (
  id: string,
  data: Partial<ExternalPlatformConnection>
): Promise<ExternalPlatformConnection> =>
  api.patch(`/api/v1/inventory/connections/${id}/`, data).then((r) => r.data);

export const deleteConnection = (id: string): Promise<void> =>
  api.delete(`/api/v1/inventory/connections/${id}/`).then((r) => r.data);

export const testConnection = (id: string): Promise<ConnectionTestResult> =>
  api.post(`/api/v1/inventory/connections/${id}/test/`).then((r) => r.data);

export const triggerSync = (id: string): Promise<{ detail: string }> =>
  api.post(`/api/v1/inventory/connections/${id}/sync/`).then((r) => r.data);

export const getSyncLogs = (id: string): Promise<WebhookDeliveryRecord[]> =>
  api.get(`/api/v1/inventory/connections/${id}/logs/`).then((r) => r.data);

export const getConflicts = (): Promise<SyncConflictAlert[]> =>
  api.get("/api/v1/inventory/conflicts/").then((r) => r.data.results ?? r.data);

export const resolveConflict = (
  id: string,
  resolution: "internal_wins" | "external_wins" | "manual"
): Promise<SyncConflictAlert> =>
  api
    .patch(`/api/v1/inventory/conflicts/${id}/resolve/`, { resolution })
    .then((r) => r.data);

// ── SLA / Resilience ────────────────────────────────────────────────────────
export const getSlaStatus = () =>
  api.get('/api/v1/sla/status/').then((r) => r.data as import('@/types').SlaStatus)

export const resetCircuit = (service: string) =>
  api.post(`/api/v1/sla/circuits/${service}/reset/`).then((r) => r.data)

// ── Organization Theme ──────────────────────────────────────────────────────
export const getOrgTheme = () =>
  api.get('/api/v1/organizations/me/theme/').then((r) => r.data as import('@/types').OrgTheme)

export const updateOrgTheme = (data: Partial<import('@/types').OrgTheme>) =>
  api.put('/api/v1/organizations/me/theme/', data).then((r) => r.data as import('@/types').OrgTheme)
