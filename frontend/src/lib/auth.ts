import { authApi } from "./api";

const TOKEN_KEY = "medloop_token";
const USER_KEY = "medloop_user";

export const authService = {
  // Save token + user to localStorage
  setSession: (token: string, user: any) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Get token
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get user
  getUser: (): any | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if logged in
  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },

   // Logout
  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    if (token) {
      try {
        await fetch(`${API}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // even if the backend call fails (offline, etc.), still clear local session
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "/login";
  },
};