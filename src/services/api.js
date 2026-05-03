import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ─── CHATS ────────────────────────────────────────────────────────────
export const chatAPI = {
  getAll: (limit = 50, skip = 0) => api.get(`/chats?limit=${limit}&skip=${skip}`),
  getById: (id) => api.get(`/chats/${id}`),
  create: (data) => api.post('/chats', data),
  update: (id, data) => api.patch(`/chats/${id}`, data),
  addMember: (id, userId) => api.post(`/chats/${id}/members`, { userId }),
  markRead: (id) => api.patch(`/chats/${id}/read`),
  delete: (id) => api.delete(`/chats/${id}`),
};

// ─── MESSAGES ─────────────────────────────────────────────────────────
export const messageAPI = {
  getMessages: (chatId, before, limit = 30) =>
    api.get(`/messages/chat/${chatId}`, { params: { before, limit } }),
  send: (chatId, data) => api.post(`/messages/chat/${chatId}`, data),
  markRead: (id) => api.patch(`/messages/${id}/read`),
  markMultipleRead: (data) => api.patch('/messages/read-multiple', data),
  edit: (id, content) => api.patch(`/messages/${id}`, { content }),
  delete: (id, deleteForEveryone = false) =>
    api.delete(`/messages/${id}`, { data: { deleteForEveryone } }),
};

// ─── USERS ────────────────────────────────────────────────────────────
export const userAPI = {
  search: (q, limit = 20) => api.get(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getById: (id) => api.get(`/users/${id}`),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
  getStatus: (id) => api.get(`/users/${id}/status`),
  getContacts: (id) => api.get(`/users/${id}/contacts`),
  addContact: (contactId) => api.post('/users/contacts/add', { contactId }),
  removeContact: (contactId) => api.delete(`/users/contacts/${contactId}`),
  updatePrivacy: (data) => api.patch('/users/privacy', data),
  discover: (limit = 12) => api.get(`/users/discover?limit=${limit}`),
  getBlocked: () => api.get('/users/blocked'),
  blockUser: (userId) => api.post('/users/block', { userId }),
  unblockUser: (userId) => api.delete(`/users/block/${userId}`),
};

// ─── FRIENDS ──────────────────────────────────────────────────────────
export const friendsAPI = {
  getStatus:      (userId) => api.get(`/friends/status/${userId}`),
  sendRequest:    (userId) => api.post('/friends/request', { userId }),
  acceptRequest:  (reqId)  => api.post(`/friends/accept/${reqId}`),
  declineRequest: (reqId)  => api.post(`/friends/decline/${reqId}`),
  cancelRequest:  (reqId)  => api.delete(`/friends/cancel/${reqId}`),
  unfriend:       (userId) => api.delete(`/friends/unfriend/${userId}`),
  getIncoming:    ()       => api.get('/friends/requests/incoming'),
  getOutgoing:    ()       => api.get('/friends/requests/outgoing'),
};

// ─── STATUS (Stories) ─────────────────────────────────────────────────
export const statusAPI = {
  upload:     (imageUrl) => api.post('/status', { imageUrl }),
  getFeed:    ()         => api.get('/status/feed'),
  delete:     (id)       => api.delete(`/status/${id}`),
  markViewed: (id)       => api.post(`/status/${id}/view`),
};

// ─── CLOUDINARY OPTIMIZATION ──────────────────────────────────────────
export function optimizeCloudinaryUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Inject f_auto,q_auto after /upload/ for automatic format + quality
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

// ─── CLOUDINARY UPLOAD ────────────────────────────────────────────────
export async function uploadToCloudinary(file) {
  // 1. Get signature from backend
  const sigRes = await api.get('/auth/cloudinary-signature');
  const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data.data;

  // 2. Upload to Cloudinary using the signature
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return res.data.secure_url;
}

export default api;
