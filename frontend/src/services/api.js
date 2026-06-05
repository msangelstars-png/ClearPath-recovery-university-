import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("clearpath_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setSession = (token, user) => {
  localStorage.setItem("clearpath_token", token);
  localStorage.setItem("clearpath_user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("clearpath_token");
  localStorage.removeItem("clearpath_user");
};

export const getStoredUser = () => {
  const raw = localStorage.getItem("clearpath_user");
  return raw ? JSON.parse(raw) : null;
};

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/me"),
};

export const platformApi = {
  onboarding: (payload) => api.post("/onboarding", payload),
  dashboard: () => api.get("/dashboard"),
  markDashboardVisited: () => api.post("/dashboard/mark-visited"),
  schools: () => api.get("/schools"),
  enrollSchool: (id) => api.post(`/schools/${id}/enroll`),
  courses: () => api.get("/courses"),
  course: (id) => api.get(`/courses/${id}`),
  enrollCourse: (id) => api.post(`/courses/${id}/enroll`),
  completeLesson: (id, payload) => api.post(`/lessons/${id}/complete`, payload),
  checkins: () => api.get("/checkins"),
  createCheckin: (payload) => api.post("/checkins", payload),
  journal: () => api.get("/journal"),
  createJournal: (payload) => api.post("/journal", payload),
  certificates: () => api.get("/certificates"),
  plans: () => api.get("/plans"),
  checkout: (payload) => api.post("/payments/checkout", payload),
  paymentStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
  aiMessages: (professorId) => api.get(`/ai/messages/${professorId}`),
  support: () => api.get("/support"),
  adminSummary: () => api.get("/admin/summary"),
  professors: () => api.get("/professors"),
  pathways: () => api.get("/pathways"),
  learningPlan: () => api.get("/learning-plan"),
  saveLearningPlan: (payload) => api.post("/learning-plan", payload),
  classes: () => api.get("/classes"),
  classDetail: (id) => api.get(`/classes/${id}`),
  joinClass: (id) => api.post(`/classes/${id}/join`),
  askClassQuestion: (id, payload) => api.post(`/classes/${id}/question`, payload),
  completeClass: (id) => api.post(`/classes/${id}/complete`),
  certificateDownload: (id) => api.get(`/certificates/${id}/download`),
  supportConfig: () => api.get("/support/config"),
  tickets: () => api.get("/support/tickets"),
  createTicket: (payload) => api.post("/support/tickets", payload),
  replyTicket: (id, payload) => api.post(`/support/tickets/${id}/reply`, payload),
  adminTickets: () => api.get("/admin/support/tickets"),
  adminUpdateTicket: (id, payload) => api.post(`/admin/support/tickets/${id}`, payload),
  programs: () => api.get("/programs"),
  program: (id) => api.get(`/programs/${id}`),
  submitAssignment: (payload) => api.post("/assignments/submit", payload),
  studentProfile: () => api.get("/student/profile"),
  exportStudentData: () => api.get("/student/export"),
  updateStudentProfile: (payload) => api.post("/student/profile", payload),
  uploadFile: (formData) => api.post("/files/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  files: (purpose) => api.get("/files", { params: purpose ? { purpose } : {} }),
  deleteFile: (id) => api.post(`/files/${id}/delete`),
  events: () => api.get("/events"),
  rsvpEvent: (id, payload) => api.post(`/events/${id}/rsvp`, payload),
  attendEvent: (id) => api.post(`/events/${id}/attend`),
  replays: () => api.get("/replays"),
  voiceSession: (payload) => api.post("/voice/session", payload),
  voiceSessions: () => api.get("/voice/sessions"),
  voiceProfessors: () => api.get("/voice/professors"),
};

export const fileDownloadUrl = (fileId) => `${API_BASE}/files/${fileId}/download?auth=${localStorage.getItem("clearpath_token")}`;

export async function streamProfessorChat(payload, onChunk) {
  const token = localStorage.getItem("clearpath_token");
  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Unable to reach professor right now");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    chunk.split("\n\n").forEach((line) => {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");
        if (data !== "[DONE]") {
          full += data;
          onChunk(full);
        }
      }
    });
  }
  return full;
}

export default api;