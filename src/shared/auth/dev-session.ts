export const DEV_AUTH_SESSION = {
  accessToken: "dev-sungrain-token",
  refreshToken: "dev-sungrain-refresh-token",
  userId: "dev-admin",
  uid: "dev-admin",
  role: "admin",
} as const;

export const isLocalDevHost = () => {
  if (typeof window === "undefined") return false;

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
};

export const shouldBypassAuthLocally = () =>
  process.env.NEXT_PUBLIC_AUTH_BYPASS !== "false" && isLocalDevHost();
