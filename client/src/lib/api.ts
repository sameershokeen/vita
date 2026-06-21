import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lifetrack_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (skip auth pages to avoid redirect loops)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lifetrack_token');
      try {
        const raw = localStorage.getItem('lifetrack-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state) {
            parsed.state.token = null;
            parsed.state.user = null;
            localStorage.setItem('lifetrack-auth', JSON.stringify(parsed));
          }
        }
      } catch { /* ignore */ }
      const path = window.location.pathname;
      const isAuthPage = path === '/login' || path === '/register' || path.startsWith('/reset-password');
      if (!isAuthPage) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  update: (data: object) => api.patch('/api/auth/me', data),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; email: string; password: string }) =>
    api.post('/api/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data),
};

// ---- Habits ----
export const habitsApi = {
  list: () => api.get('/api/habits'),
  create: (data: object) => api.post('/api/habits', data),
  update: (id: string, data: object) => api.patch(`/api/habits/${id}`, data),
  delete: (id: string) => api.delete(`/api/habits/${id}`),
  toggle: (id: string, date?: string) => api.post(`/api/habits/${id}/toggle`, { date }),
  stats: (params?: object) => api.get('/api/habits/stats', { params }),
};

// ---- Goals ----
export const goalsApi = {
  list: (params?: object) => api.get('/api/goals', { params }),
  create: (data: object) => api.post('/api/goals', data),
  update: (id: string, data: object) => api.patch(`/api/goals/${id}`, data),
  delete: (id: string) => api.delete(`/api/goals/${id}`),
  addMilestone: (id: string, data: object) => api.post(`/api/goals/${id}/milestones`, data),
  updateMilestone: (id: string, milestoneId: string, data: object) =>
    api.patch(`/api/goals/${id}/milestones/${milestoneId}`, data),
};

// ---- Time ----
export const timeApi = {
  getDay: (date?: string) => api.get('/api/time', { params: { date } }),
  getWeek: (from?: string) => api.get('/api/time/week', { params: { from } }),
  create: (data: object) => api.post('/api/time', data),
  update: (id: string, data: object) => api.patch(`/api/time/${id}`, data),
  delete: (id: string) => api.delete(`/api/time/${id}`),
  stats: (month?: string) => api.get('/api/time/stats', { params: { month } }),
};

// ---- Expenses ----
export const expensesApi = {
  list: (params?: object) => api.get('/api/expenses', { params }),
  create: (data: object) => api.post('/api/expenses', data),
  update: (id: string, data: object) => api.patch(`/api/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/expenses/${id}`),
  summary: (month?: string) => api.get('/api/expenses/summary', { params: { month } }),
};

// ---- Journal ----
export const journalApi = {
  list: (params?: object) => api.get('/api/journal', { params }),
  create: (data: object) => api.post('/api/journal', data),
  update: (id: string, data: object) => api.patch(`/api/journal/${id}`, data),
  delete: (id: string) => api.delete(`/api/journal/${id}`),
  prompt: () => api.get('/api/journal/prompt'),
  streak: () => api.get('/api/journal/streak'),
  mood: (days?: number) => api.get('/api/journal/mood', { params: { days } }),
};

// ---- Progress ----
export const progressApi = {
  overview: () => api.get('/api/progress/overview'),
  habitsMonthly: (months?: number) => api.get('/api/progress/habits/monthly', { params: { months } }),
};
