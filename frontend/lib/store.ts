import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  categories?: string[];
  keywords?: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  searchQuery: string;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setSearchQuery: (query: string) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  searchQuery: "",
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    set({ token: null, user: null });
  },
}));
