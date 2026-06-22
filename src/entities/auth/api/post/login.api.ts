import { apiClient } from "@/shared/api/apiClient";
import {
  DEV_AUTH_SESSION,
  shouldBypassAuthLocally,
} from "@/shared/auth/dev-session";
import axios from "axios";
import { LoginDTO } from "../dto/login.dto";

axios.defaults.withCredentials = true;

const devCredentials = {
  email: "admin@sungrain.test",
  password: "sungrain2026",
};

export const login = async (data: LoginDTO) => {
  try {
    if (typeof window === "undefined") return;

    if (
      shouldBypassAuthLocally() &&
      data.email === devCredentials.email &&
      data.password === devCredentials.password
    ) {
      const devSession = {
        access_token: DEV_AUTH_SESSION.accessToken,
        refresh_token: DEV_AUTH_SESSION.refreshToken,
        userId: DEV_AUTH_SESSION.userId,
        uid: DEV_AUTH_SESSION.uid,
        role: DEV_AUTH_SESSION.role,
      };

      localStorage.setItem("id", JSON.stringify(devSession.uid));

      return devSession;
    }

    const response = await apiClient.post("/auth/login", data);

    localStorage.setItem("id", JSON.stringify(response.data.uid));

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Login failed with status:", error.response.status);
    } else {
      console.error("Login error:", error);
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.get("/admin/auth/logout");

    return response.data;
  } catch (error) {
    throw error;
  }
};
