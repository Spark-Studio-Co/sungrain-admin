import { useAuthData } from "@/entities/auth/model/use-auth-store";
import axios from "axios";

// ✅ Create Axios Instance
export const apiClient = axios.create({
  // baseURL: "http://localhost:6001",
  baseURL: "https://agro-pv-backend-production.up.railway.app/api",
  withCredentials: true,
});

const refresh = useAuthData.getState().refreshToken;

// ✅ Automatically Attach Token to Requests
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

// ✅ Refresh Token Function
const refreshToken = async (data: any) => {
  try {
    console.log(data);
    const response = await apiClient.post("/auth/refresh", {
      refresh_token: data,
    });
    const { token } = response.data;

    // ✅ Save new token in Zustand
    useAuthData.getState().saveToken(token);

    return token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
};

// ✅ Handle 401 Unauthorized Responses & Refresh Token
apiClient.interceptors.response.use(
  (response) => response, // ✅ Forward successful responses
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // ✅ Prevent infinite loop

      try {
        const newToken = await refreshToken(refresh as any);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest); // ✅ Retry the failed request
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
      }
    }

    return Promise.reject(error);
  }
);
