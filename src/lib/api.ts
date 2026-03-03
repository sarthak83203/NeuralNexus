const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

const get = (path: string) => fetch(`${API_BASE}${path}`, { ...fetchOptions, method: 'GET' }).then(r => r.json());
const post = (path: string, body?: any) => fetch(`${API_BASE}${path}`, { ...fetchOptions, method: 'POST', body: body ? JSON.stringify(body) : undefined }).then(r => r.json());

export const api = {
  auth: {
    login: (username: string, password: string) => post('/auth/login', { username, password }),
    register: (username: string, password: string, email?: string) => post('/auth/register', { username, password, email }),
    logout: () => post('/auth/logout'),
    me: () => get('/auth/me'),
  },
  transactions: {
    create: (amount: number, location: number) => post('/transactions/create', { amount, location }),
    predict: (amount: number, location: number, hour: number) => post('/transactions/predict', { amount, location, hour }),
    analyze: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE}/transactions/analyze`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(r => r.json());
    },
    history: (limit: number = 20) => get(`/transactions/history?limit=${limit}`),
    chat: (message: string) => post('/transactions/chat', { message }),
  },
  dashboard: {
    get: () => get('/transactions/dashboard'),
  },
  admin: {
    flagged: (limit: number = 50) => get(`/admin/flagged?limit=${limit}`),
    reviewFlagged: (id: string) => post(`/admin/flagged/${id}/review`),
    stats: () => get('/admin/stats'),
  },
};
