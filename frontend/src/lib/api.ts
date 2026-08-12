import { API_BASE_URL } from "./constants";

// ─── Generic fetcher ───────────────────────────────────────────────
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Health ────────────────────────────────────────────────────────
export const healthApi = {
  ping: () => fetcher<{ status: string }>("/health"),
};

// ─── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: any) =>
    fetcher<any>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) =>
    fetcher<any>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: (token: string) =>
    fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
};

// ─── Prescription Agent ────────────────────────────────────────────
export const prescriptionApi = {
  parseText: (text: string) =>
    fetcher<any>(`/api/v1/prescription/parse-text?text=${encodeURIComponent(text)}`, { method: "POST" }),
  parseImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE_URL}/api/v1/prescription/parse`, {
      method: "POST",
      body: form,
    }).then((r) => r.json());
  },
};

// ─── Reminder Agent ────────────────────────────────────────────────
export const patientPortalApi = {
  me: () => fetcher<any>("/api/v1/patient/me"),
  medicines: () => fetcher<any>("/api/v1/patient/me/medicines"),
  confirmDose: (doseId: string) =>
    fetcher<any>(`/api/v1/patient/me/confirm-dose/${doseId}`, { method: "POST" }),
  adherence: () => fetcher<any>("/api/v1/patient/me/adherence"),
  stock: () => fetcher<any>("/api/v1/patient/me/stock"),
  medicinesList: () => fetcher<any>("/api/v1/patient/me/medicines/list"),
  medicinesHeatmap: (weeks: number = 12) =>
    fetcher<any>(`/api/v1/patient/me/medicines/heatmap?weeks=${weeks}`),
};

// ─── Stock Agent ───────────────────────────────────────────────────
export const clinicApi = {
  getAllStock: () => fetcher<any>("/api/v1/patients/stock/all"),
  getPatientMedicines: (patientId: string) =>
    fetcher<any>(`/api/v1/patients/${patientId}/medicines`),
  getDoseHistory: (patientId: string, days: number = 14) =>
    fetcher<any>(`/api/v1/patients/${patientId}/dose-history?days=${days}`),
  testReminder: (patientId: string, medicine: string, dosage: string) =>
    fetcher<any>(`/api/v1/reminder/test-reminder/${patientId}?medicine_name=${medicine}&dosage=${dosage}`, { method: "POST" }),
};

// ─── Future agents — add here ──────────────────────────────────────
// export const healthMonitorApi = { ... }
// export const followupApi = { ... }