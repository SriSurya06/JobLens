import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("joblens_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("joblens_token");
      localStorage.removeItem("joblens_user");

      window.location.href = "/login";
    }

    return Promise.reject(err);
  },
);

// AUTH
export const authAPI = {
  login: (data) => api.post("/auth/login", data),

  forgotPassword: (data) => api.post("/auth/forgot-password", data),

  resetPassword: (data) => api.post("/auth/reset-password", data),

  changePassword: (data) => api.patch("/auth/change-password", data),

  getMe: () => api.get("/auth/me"),
};

// COORDINATOR
export const coordinatorAPI = {
  getDashboard: () => api.get("/coordinator/dashboard"),

  getPlacementStats: (batch) =>
    api.get(`/coordinator/placement-stats/${batch}`),

 getStudents: (params) => api.get("/coordinator/students", { params }),

getStudentSkills: () =>
  api.get("/coordinator/students/skills"),

getStudentDetail: (studentId) =>
  api.get(`/coordinator/students/${studentId}`),

  sendNotification: (data) => api.post("/coordinator/notify", data),

  getAuditLogs: (params) => api.get("/coordinator/audit-logs", { params }),
};

// ON-CAMPUS DRIVES
export const onCampusAPI = {
  create: (data) => api.post("/oncampus", data),

  getAll: (params) => api.get("/oncampus", { params }),

  getById: (id) => api.get(`/oncampus/${id}`),

  update: (id, data) => api.patch(`/oncampus/${id}`, data),

  getEligible: (id) => api.get(`/oncampus/${id}/eligible-students`),

  getApplications: (id, p) =>
    api.get(`/oncampus/${id}/applications`, {
      params: p,
    }),
};

// OFF-CAMPUS DRIVES
export const offCampusAPI = {
  create: (data) => api.post("/offcampus", data),

  getAll: (params) => api.get("/offcampus", { params }),

  getById: (id) => api.get(`/offcampus/${id}`),

  update: (id, data) => api.patch(`/offcampus/${id}`, data),

  delete: (id) => api.delete(`/offcampus/${id}`),
};

// ROUNDS
export const roundsAPI = {
  create: (data) => api.post("/rounds", data),

  update: (id, data) => api.patch(`/rounds/${id}`, data),

  getByDrive: (driveId) => api.get(`/rounds/drive/${driveId}`),

  uploadEligible: (id, form) => api.patch(`/rounds/${id}/eligible-list`, form),

  uploadAttended: (id, form) => api.patch(`/rounds/${id}/attended-list`, form),

  uploadQualified: (id, data) =>
  api.patch(`/rounds/${id}/qualified-list`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// STUDENT
export const studentAPI = {
  getProfile: () => api.get("/student/profile"),

  updateProfile: (data) => api.patch("/student/profile", data),

  uploadResume: (form) => api.post("/student/resume", form),

  getDashboard: () => api.get("/student/dashboard"),

  getOnCampusDrives: () => api.get("/student/drives/oncampus"),

  applyToDrive: (id) => api.post(`/student/drives/oncampus/${id}/apply`),

  getAppStatus: (id) => api.get(`/student/drives/oncampus/${id}/status`),

  getNotifications: () => api.get('/student/notifications'),
  markNotificationRead: (id) => api.patch(`/student/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/student/notifications/read-all'),
  clearNotifications: () => api.delete('/student/notifications'),
  clearNotification: (id) => api.delete(`/student/notifications/${id}`),

  getOffCampusFeed: (params) =>
    api.get("/student/drives/offcampus", { params }),

  // AI JOB LINKS
  generateJobLinks: (data) => api.post("/student/job-links", data),

  // RESUME MATCH AI
  resumeMatch: (data) => api.post("/student/resume-match", data),

  // AI CHATBOT
  chatbotMessage: (data) => api.post("/student/chatbot", data),
  getChatHistory: () => api.get("/student/chatbot/history"),
  getChatById: (id) => api.get(`/student/chatbot/history/${id}`),
  deleteChatHistory: (id) => api.delete(`/student/chatbot/history/${id}`),
  // JOB VERIFIER
  checkJobAuthenticity: (data) => api.post("/student/job-verifier/check", data),

  getJobVerifierHistory: () => api.get("/student/job-verifier/history"),
};

// FEEDBACK
export const feedbackAPI = {
  submit: (data) => api.post("/feedback", data),

  getCompanies: () => api.get("/feedback/companies"),

  getByCompany: (name, p) =>
    api.get(`/feedback/company/${name}`, {
      params: p,
    }),

  getByDrive: (id) => api.get(`/feedback/drive/${id}`),
};
export default api;
