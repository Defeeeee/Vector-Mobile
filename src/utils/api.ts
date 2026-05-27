import { storage } from "./storage";

export const API_URL = "https://api.flightlog.fdiaznem.com.ar";
export const AUTH_URL = "https://auth.flightlog.fdiaznem.com.ar";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

// Global hook/callback reference to trigger logout from AuthContext on 401
let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}) {
  const token = await storage.getItem("session_token");
  console.log(`[apiFetch] Requesting: ${endpoint}, token length: ${token ? token.length : 0}`);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const fullUrl = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(fullUrl, config);
    console.log(`[apiFetch] Response status: ${response.status} for ${endpoint}`);
    
    if (response.status === 401) {
      console.log(`apiFetch: 401 Unauthorized for ${endpoint}`);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    
    return response;
  } catch (error) {
    console.error(`apiFetch error for ${endpoint}:`, error);
    throw error;
  }
}

export async function authFetch(endpoint: string, options: RequestOptions = {}) {
  const token = await storage.getItem("session_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    method: options.method || "POST",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const fullUrl = `${AUTH_URL}${endpoint}`;
  
  try {
    return await fetch(fullUrl, config);
  } catch (error) {
    console.error(`authFetch error for ${endpoint}:`, error);
    throw error;
  }
}
