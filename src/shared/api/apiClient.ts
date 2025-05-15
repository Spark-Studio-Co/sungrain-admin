import { useAuthData } from "@/entities/auth/model/use-auth-store";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://backend.sungrain.kz/api",
  // baseURL: "http://localhost:6001/api",
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthData.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token function
const refreshToken = async (refresh: string) => {
  try {
    const response = await apiClient.post("/auth/refresh", {
      refresh_token: refresh,
    });

    useAuthData.getState().saveToken(response.data.access_token);
    return response.data.access_token;
  } catch (err) {
    console.error("❌ Refresh failed:", err);
    useAuthData.getState().removeToken?.();
    window.location.href = "/login"; // 🔁 Redirect
    throw err;
  }
};

// Global flag to avoid infinite loops
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

// Axios response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const refresh = useAuthData.getState().refreshToken;
        const newToken = await refreshToken(refresh as string);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
