import axios from 'axios';

const saApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api' });

saApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('shms_sa_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

saApi.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('shms_sa_token');
      window.location.href = '/super-admin/auth';
    }
    return Promise.reject(err.response?.data || err);
  },
);

export default saApi;
