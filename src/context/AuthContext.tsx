import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../utils/storage";
import { apiFetch, authFetch, registerUnauthorizedCallback } from "../utils/api";
import { useRouter } from "expo-router";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  license_type: string;
  cma_expiry: string;
}

interface AuthContextData {
  isAuthenticated: boolean;
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ success: boolean; error?: string }>;
  recoverPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load token and profile on boot
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await storage.getItem("session_token");
        if (token) {
          await fetchProfile();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setLoading(false);
      }
    }

    checkAuth();

    // Register 401 interceptor callback to automatically log out if token is expired/invalid
    registerUnauthorizedCallback(() => {
      handleLogout();
    });
  }, []);

  const fetchProfile = async () => {
    console.log("[AuthContext] Fetching user profile...");
    try {
      const response = await apiFetch("/profiles");
      if (response.ok) {
        const data = await response.json();
        console.log("[AuthContext] Profile response data:", JSON.stringify(data));
        // The endpoint returns a list of profiles, first is the active user
        if (Array.isArray(data) && data.length > 0) {
          setUser(data[0]);
          setIsAuthenticated(true);
          console.log("[AuthContext] Profile loaded, authenticated set to true");
        } else {
          console.log("[AuthContext] No profiles found in response array, logging out");
          // If response ok but no profile list, handle logout
          await handleLogout();
        }
      } else {
        console.log(`[AuthContext] Profile fetch failed with status: ${response.status}`);
        await handleLogout();
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch profile:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("[AuthContext] Executing logout / clearing session");
    await storage.deleteItem("session_token");
    await storage.deleteItem("refresh_token");
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
    
    // Defer router navigation to avoid React state/rendering race conditions
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 100);
  };

  const login = async (email: string, password: string) => {
    console.log(`[AuthContext] Initiating login for: ${email}`);
    try {
      const response = await authFetch("/login", {
        method: "POST",
        body: { email, password },
      });

      const data = await response.json();
      console.log(`[AuthContext] Login response status: ${response.status}`);

      if (!response.ok) {
        return { success: false, error: data.detail || "Credenciales incorrectas" };
      }

      if (data.access_token) {
        console.log(`[AuthContext] Saving token, length: ${data.access_token.length}`);
        await storage.setItem("session_token", data.access_token);
        if (data.refresh_token) {
          await storage.setItem("refresh_token", data.refresh_token);
        }
        setIsAuthenticated(true);
        
        // Fetch profile details immediately after successful login
        setLoading(true);
        await fetchProfile();
        
        return { success: true };
      } else {
        return { success: false, error: "No se recibió un token de acceso" };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await authFetch("/register", {
        method: "POST",
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || "Error en la registración" };
      }

      // If sign up doesn't auto-login (due to email confirmation, etc.), return success
      if (data.access_token) {
        await storage.setItem("session_token", data.access_token);
        if (data.refresh_token) {
          await storage.setItem("refresh_token", data.refresh_token);
        }
        setIsAuthenticated(true);
        setLoading(true);
        await fetchProfile();
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const recoverPassword = async (email: string) => {
    try {
      const response = await authFetch("/recover", {
        method: "POST",
        body: { email },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || "Error enviando correo de recuperación" };
      }

      return { success: true };
    } catch (error) {
      console.error("Recovery failed:", error);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const logout = async () => {
    await handleLogout();
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        recoverPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
