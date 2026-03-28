const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    createdAt: string;
  };
  token: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const err = data as ApiError;
    throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data as T;
}

export async function signup(input: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<AuthResponse>(response);
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<AuthResponse>(response);
}

export interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  period: "one-time" | "monthly" | "yearly";
  features: string[];
  displayOrder: number;
}

export async function getPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/api/plans`);
  return handleResponse<Plan[]>(response);
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export async function createCheckout(planId: string, token: string): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });
  return handleResponse<CheckoutResponse>(response);
}

export async function wakeUpBackend(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.debug("Backend wake-up request failed (non-critical):", error);
  }
}

export interface UserSubscription {
  _id: string;
  userId: string;
  planId: string;
  planName: string;
  status: "active" | "canceled" | "expired" | "pending" | "completed";
  startDate: string;
  endDate?: string;
  amountPaid: number;
  currency: string;
  period: "one-time" | "monthly" | "yearly";
}

export async function getUserSubscriptions(token: string): Promise<UserSubscription[]> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UserSubscription[]>(response);
}

export async function checkUserHasActiveSubscription(token: string): Promise<boolean> {
  try {
    const subscriptions = await getUserSubscriptions(token);
    return subscriptions.some(
      (sub) => sub.status === "active" || sub.status === "completed"
    );
  } catch {
    return false;
  }
}

export async function confirmCheckout(
  sessionId: string,
  token: string
): Promise<UserSubscription> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  });
  return handleResponse<UserSubscription>(response);
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UserProfile>(response);
}

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
  profilePicture?: string;
}

export async function updateProfile(
  data: UpdateProfileRequest,
  token: string
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<UserProfile>(response);
}

export interface UsageData {
  usage: {
    voicesGenerated: number;
    pdfDownloads: number;
    summarizationEdits: number;
  };
  limits: {
    voices: number; // -1 means unlimited
    edits: number;
    pdfs: number;
  };
  plan: {
    name: string;
    period: "one-time" | "monthly" | "yearly" | "free";
  };
  subscription: {
    status: string;
    startDate: string;
    endDate?: string;
  };
}

export async function getUserUsage(token: string): Promise<UsageData> {
  const response = await fetch(`${API_BASE_URL}/api/usage`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UsageData>(response);
}

export async function incrementUsage(
  type: "voices" | "pdfs" | "edits",
  amount: number,
  token: string
): Promise<UsageData> {
  const response = await fetch(`${API_BASE_URL}/api/usage/increment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, amount }),
  });
  return handleResponse<UsageData>(response);
}

export async function summarizeText(text: string, token: string): Promise<{ summarizedText: string }> {
  const response = await fetch(`${API_BASE_URL}/api/summarize/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  return handleResponse<{ summarizedText: string }>(response);
}

export interface UserRecording {
  _id: string;
  userId: string;
  transcribedText: string;
  summarizedText?: string;
  createdAt: string;
}

export interface UserSummary {
  _id: string;
  userId: string;
  originalText: string;
  summarizedText: string;
  createdAt: string;
}

export interface UserPdf {
  _id: string;
  userId: string;
  summaryText: string;
  fileName: string;
  createdAt: string;
}

export async function getUserRecordings(token: string): Promise<UserRecording[]> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/recordings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UserRecording[]>(response);
}

export async function getUserSummaries(token: string): Promise<UserSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/summaries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UserSummary[]>(response);
}

export async function getUserPdfs(token: string): Promise<UserPdf[]> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/pdfs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UserPdf[]>(response);
}

export async function saveRecording(
  transcribedText: string,
  summarizedText: string | undefined,
  token: string
): Promise<UserRecording> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/recordings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ transcribedText, summarizedText }),
  });
  return handleResponse<UserRecording>(response);
}

export async function saveSummary(
  originalText: string,
  summarizedText: string,
  token: string
): Promise<UserSummary> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/summaries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ originalText, summarizedText }),
  });
  return handleResponse<UserSummary>(response);
}

export async function savePdf(summaryText: string, fileName: string, token: string): Promise<UserPdf> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/pdfs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ summaryText, fileName }),
  });
  return handleResponse<UserPdf>(response);
}

export async function updateRecordingWithSummary(
  transcribedText: string,
  summarizedText: string,
  token: string
): Promise<UserRecording> {
  const response = await fetch(`${API_BASE_URL}/api/user-data/recordings/summary`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ transcribedText, summarizedText }),
  });
  return handleResponse<UserRecording>(response);
}
