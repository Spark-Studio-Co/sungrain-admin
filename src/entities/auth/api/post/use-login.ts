import { useMutation } from "@tanstack/react-query";
import { LoginDTO } from "../dto/login.dto";
import { login } from "./login";
import { useAuthData } from "../../model/use-auth-store";

export const useLogin = () => {
  const { saveToken, saveUserId, saveRole, saveRefreshToken } = useAuthData();

  return useMutation({
    mutationFn: (data: LoginDTO) => login(data),
    onSuccess: (response) => {
      saveToken(response.access_token);
      saveRefreshToken(response.refresh_token);
      saveUserId(response.userId);
      saveRole(response.role);
    },
  });
};
