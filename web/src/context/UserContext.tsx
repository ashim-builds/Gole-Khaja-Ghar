import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, UserProfile, setAuthToken } from "@/lib/api";

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");
      if (token) {
        setAuthToken(token);
        url.searchParams.delete("token");
        const newSearch = url.searchParams.toString();
        const newUrl = url.pathname + (newSearch ? `?${newSearch}` : "") + url.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch {}
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
