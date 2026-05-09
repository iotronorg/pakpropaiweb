import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
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
  api.post(`/properties/${id}/request-verification/`);

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

// ── Audit ─────────────────────────────────────────────────────────────────────
export const getAudits = () =>
  api.get("/audit/");

export const downloadAudit = (id: number) =>
  api.get(`/audit/download/${id}/`, { responseType: "blob" });

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

export const getAgentsList = (params?: Record<string, unknown>) =>
  api.get("/agents/", { params });

export const createAgent = (data: Record<string, unknown>) =>
  api.post("/agents/", data);

export const updateAgent = (id: number, data: Record<string, unknown>) =>
  api.patch(`/agents/${id}/`, data);

export const deleteAgent = (id: number) =>
  api.delete(`/agents/${id}/`);

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

export const getLeadReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/leads/", { params });

export const getAgentReport = () =>
  api.get("/reports/agents/");

export const getPropertyReport = (params?: { period?: "weekly" | "monthly" }) =>
  api.get("/reports/properties/", { params });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params?: Record<string, unknown>) =>
  api.get("/notifications/", { params });

export const markNotificationsRead = (ids?: string[]) =>
  api.post("/notifications/mark-read/", ids ? { ids } : {});

// ── System Config ─────────────────────────────────────────────────────────────
export const getConfig = () =>
  api.get("/config/").then((r) => r.data);

export const updateConfig = (data: Record<string, string>) =>
  api.patch("/config/", data).then((r) => r.data);
