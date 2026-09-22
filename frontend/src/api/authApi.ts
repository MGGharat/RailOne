import api from './client';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data as LoginResponse;
  },

  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data.data as LoginResponse;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data as User;
  },

  updateMe: async (updateData: Partial<User>) => {
    const res = await api.put('/auth/me', updateData);
    return res.data.data as User;
  }
};
