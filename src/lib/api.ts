import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
export const sendOtp = (phone: string) =>
  api.post("/auth/otp/send/", { phone });

export const verifyOtp = (phone: string, code: string) =>
  api.post("/auth/otp/verify/", { phone, code });

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

export const registerAgent = (data: Record<string, unknown>) => {
  // Uses a clean axios instance — no auth headers, no credentials — so the
  // registration endpoint is truly unauthenticated.
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });
  return instance.post("/agents/register/", data);
};

export const approveAgent = (id: number) =>
  api.post(`/agents/${id}/approve/`);

export const rejectAgent = (id: number, rejection_reason: string) =>
  api.post(`/agents/${id}/reject/`, { rejection_reason });

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

export const getAgentPersonalReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/my-stats/", { params });

export const getLeadReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/leads/", { params });

export const getAgentReport = () =>
  api.get("/reports/agents/");

export const getPropertyReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/properties/", { params });

export const getRevenueReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/revenue/", { params });

export const getBotReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/bot/", { params });

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
