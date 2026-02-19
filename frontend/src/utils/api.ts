import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data)
};

export const siebApi = {
  getAll: (params?: Record<string, string>) => api.get('/siebe', { params }),
  getById: (id: string) => api.get(`/siebe/${id}`),
  create: (data: Record<string, unknown>) => api.post('/siebe', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/siebe/${id}`, data),
  delete: (id: string) => api.delete(`/siebe/${id}`),
  addInstrument: (siebId: string, data: Record<string, unknown>) =>
    api.post(`/siebe/${siebId}/instrumente`, data),
  removeInstrument: (siebId: string, instrumentId: string) =>
    api.delete(`/siebe/${siebId}/instrumente/${instrumentId}`),
  updateInstrument: (siebId: string, instrumentId: string, data: Record<string, unknown>) =>
    api.put(`/siebe/${siebId}/instrumente/${instrumentId}`, data),
  uploadBild: (siebId: string, file: File) => {
    const formData = new FormData();
    formData.append('bild', file);
    return api.post(`/siebe/${siebId}/bild`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const instrumentApi = {
  getAll: (params?: Record<string, string>) => api.get('/instrumente', { params }),
  getById: (id: string) => api.get(`/instrumente/${id}`),
  create: (data: Record<string, unknown>) => api.post('/instrumente', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/instrumente/${id}`, data),
  delete: (id: string) => api.delete(`/instrumente/${id}`),
  uploadBild: (instrumentId: string, file: File) => {
    const formData = new FormData();
    formData.append('bild', file);
    return api.post(`/instrumente/${instrumentId}/bild`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const fachabteilungApi = {
  getAll: () => api.get('/fachabteilungen'),
  getById: (id: string) => api.get(`/fachabteilungen/${id}`),
  create: (data: Record<string, unknown>) => api.post('/fachabteilungen', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/fachabteilungen/${id}`, data),
  delete: (id: string) => api.delete(`/fachabteilungen/${id}`)
};

export const herstellerApi = {
  getAll: () => api.get('/hersteller'),
  getById: (id: string) => api.get(`/hersteller/${id}`),
  create: (data: Record<string, unknown>) => api.post('/hersteller', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/hersteller/${id}`, data),
  delete: (id: string) => api.delete(`/hersteller/${id}`)
};

export const aenderungApi = {
  getAll: (params?: Record<string, string>) => api.get('/aenderungen', { params }),
  getPending: () => api.get('/aenderungen/pending'),
  create: (data: Record<string, unknown>) => api.post('/aenderungen', data),
  approve: (id: string, kommentar?: string) =>
    api.post(`/aenderungen/${id}/approve`, { kommentar }),
  reject: (id: string, ablehnungsGrund: string) =>
    api.post(`/aenderungen/${id}/reject`, { ablehnungsGrund })
};

export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (id: string, oldPassword: string, newPassword: string) =>
    api.post(`/users/${id}/change-password`, { oldPassword, newPassword })
};
