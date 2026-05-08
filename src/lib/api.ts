import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,  // send httpOnly auth cookies automatically
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Refresh token lives in an httpOnly cookie — no body needed
        await axios.post(`${BASE_URL}/auth/token/refresh/`, {}, { withCredentials: true });
        return api(original);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const sendOtp = (phone: string) =>
  api.post("/auth/otp/send/", { phone });

export const verifyOtp = (phone: string, code: string) =>
  api.post("/auth/otp/verify/", { phone, code });

export const getMe = () => api.get("/auth/me/");
export const logout = () => api.post("/auth/logout/");

// Users (admin)
export const getUsers = (role?: string) =>
  api.get("/auth/users/", { params: role ? { role } : undefined });

export const searchUsers = (query: string) =>
  api.get("/auth/users/", { params: { search: query } });
export const createUser = (data: Record<string, unknown>) =>
  api.post("/auth/users/", data);
export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.patch(`/auth/users/${id}/`, data);
export const deleteUser = (id: string) =>
  api.delete(`/auth/users/${id}/`);

// Leads
export const getLeads = () => api.get("/leads/");
export const updateLead = (id: string, data: Record<string, unknown>) =>
  api.patch(`/leads/${id}/`, data);

// Verification
export const getVerificationQueue = (params?: Record<string, unknown>) =>
  api.get("/verification/queue/", { params });
export const reviewVerification = (id: string, data: { status: string; notes?: string }) =>
  api.patch(`/verification/queue/${id}/`, data);
export const getDocumentScans = (params?: Record<string, unknown>) =>
  api.get("/verification/documents/", { params });
export const linkDocumentToVerification = (scanId: number, verificationId: string) =>
  api.post(`/verification/documents/${scanId}/link/${verificationId}/`);

// Properties
export const getProperties = (params?: Record<string, unknown>) =>
  api.get("/properties/", { params });

export const getMyProperties = (params?: Record<string, unknown>) =>
  api.get("/properties/mine/", { params });

export const requestVerification = (id: string) =>
  api.post(`/properties/${id}/request_verification/`);

export const rescoreProperty = (id: string) =>
  api.post(`/properties/${id}/rescore/`);

export const rescoreAllProperties = () =>
  api.post("/properties/rescore-all/");

export const getProperty = (id: string) => api.get(`/properties/${id}/`);

export const createProperty = (data: Record<string, unknown>) =>
  api.post("/properties/", data);

export const updateProperty = (id: string, data: Record<string, unknown>) =>
  api.patch(`/properties/${id}/`, data);

export const deleteProperty = (id: string) =>
  api.delete(`/properties/${id}/`);

// Verification
export const runFraudCheck = (query: string) =>
  api.post("/verification/fraud-check/", { query });

// Audit
export const downloadAudit = (id: number) =>
  api.get(`/audit/download/${id}/`, { responseType: "blob" });

// Deal Locks
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

// Payments
export const createCheckout = (dealId: string, gateway: "safepay" | "bsecure") =>
  api.post(`/payments/checkout/${dealId}/`, { gateway });

export const getPayments = () =>
  api.get("/payments/");

// Agents
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

// Document scans (detail)
export const getDocumentScan = (id: number) =>
  api.get(`/verification/documents/${id}/`);

// Fraud monitoring
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

// ── System Config ──────────────────────────────────────────────────────────────
export const getConfig = () =>
  api.get("/config/").then((r) => r.data);

export const updateConfig = (data: Record<string, string>) =>
  api.patch("/config/", data).then((r) => r.data);
