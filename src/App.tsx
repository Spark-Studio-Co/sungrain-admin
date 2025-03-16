import { QueryClientProvider } from "@tanstack/react-query";
import reactQueryClient from "./shared/api/queryClient";
import { Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { LoginPage } from "./pages/login-page/login-page";
import ContractsPage from "./pages/contracts-page/contracts-page";
import UsersPage from "./pages/users-page/users-page";
import ContractsInnerPage from "./pages/contracts-inner-page/contracts-inner-page";
import DashboardPage from "./pages/dashboard-page/dashboard-page";
import { useAuthData } from "./entities/auth/model/use-auth-store";
import { checkIsAdmin } from "./entities/users/api/check-is-admin";
import { useState, useEffect } from "react";

function App() {
  const { token } = useAuthData();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });

  useEffect(() => {
    if (!token) {
      setIsAdmin(null);
      localStorage.removeItem("isAdmin");
      return;
    }

    const fetchAdminStatus = async () => {
      try {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
        localStorage.setItem("isAdmin", JSON.stringify(adminStatus));
      } catch (error) {
        setIsAdmin(false);
        localStorage.setItem("isAdmin", "false");
      }
    };

    if (isAdmin === null) {
      fetchAdminStatus();
    }
  }, [token, isAdmin]);

  return (
    <QueryClientProvider client={reactQueryClient}>
      <Routes>
        {token ? (
          isAdmin ? (
            <>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/contracts" element={<ContractsPage />} />
              <Route
                path="/admin/contracts/:id"
                element={<ContractsInnerPage />}
              />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/:id" element={<ContractsInnerPage />} />
              <Route path="*" element={<Navigate to="/contracts" replace />} />
            </>
          )
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
