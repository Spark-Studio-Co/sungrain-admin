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
import { Loader } from "./shared/ui/loader";

function App() {
  const { token } = useAuthData();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // ✅ Start with `null`

  useEffect(() => {
    if (!token) {
      setIsAdmin(null); // ✅ Prevent fetching if there's no token
      return;
    }

    const fetchAdminStatus = async () => {
      try {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus); // ✅ Ensure it gets a boolean
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false); // ✅ Default to `false` if error
      }
    };

    fetchAdminStatus();
  }, [token]);

  // ✅ Prevent rendering until `isAdmin` is determined
  if (isAdmin === null) {
    return <Loader variant="card" />;
  }

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
