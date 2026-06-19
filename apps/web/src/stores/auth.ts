import { create } from 'zustand';
import { api, setTokens, clearTokens, getTokens } from '@/lib/api';
import { resetApolloClient } from '@/lib/apollo-client';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, tokens } = await api.post<{
      user: User;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', { email, password }, { skipAuth: true });

    setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (data) => {
    const { user, tokens } = await api.post<{
      user: User;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', data, { skipAuth: true });

    setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearTokens();
    resetApolloClient();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    const { accessToken } = getTokens();
    if (!accessToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
