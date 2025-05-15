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
import { checkIsAdmin } from "./entities/users/api/get/check-is-admin.api";
import { useState, useEffect } from "react";
import FinancesPage from "./pages/finances-page/finances-page";
import AgricultureManagementPage from "./pages/cultrures-page/cultures-page";
import ReceiverPage from "./pages/receiver-page/receiver-page";
import SenderPage from "./pages/sender-page/sender-page";
import StationsPage from "./pages/stations-page/stations-page";
import CompaniesPage from "./pages/companies-page/companies-page";
import UserContractsPage from "./pages/contracts-user-page/contracts-user-page";
import ApplicationPage from "./pages/application-page/application-page";
import OwnerPage from "./pages/owner-page/owner-page";

function App() {
  const { token, removeToken } = useAuthData();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });

  useEffect(() => {
    removeToken();
  }, []);

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

    fetchAdminStatus();
  }, [token]);

  const renderRoutes = () => {
    if (!token) {
      return (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      );
    }

    if (isAdmin) {
      return (
        <>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/contracts" element={<ContractsPage />} />
          <Route path="/admin/contracts/:id" element={<ContractsInnerPage />} />
          <Route
            path="/admin/contracts/:id/applications/:application_id"
            element={<ApplicationPage />}
          />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/finance" element={<FinancesPage />} />
          <Route
            path="/admin/cultures"
            element={<AgricultureManagementPage />}
          />
          <Route path="/admin/sender" element={<SenderPage />} />
          <Route path="/admin/owner" element={<OwnerPage />} />
          <Route path="/admin/receiver" element={<ReceiverPage />} />
          <Route path="/admin/stations" element={<StationsPage />} />
          <Route path="/admin/companies" element={<CompaniesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      );
    }

    return (
      <>
        <Route path="/contracts" element={<UserContractsPage />} />
        <Route path="/contracts/:id" element={<ContractsInnerPage />} />
        <Route path="*" element={<Navigate to="/contracts" replace />} />
      </>
    );
  };

  return (
    <QueryClientProvider client={reactQueryClient}>
      <Routes>{renderRoutes()}</Routes>
    </QueryClientProvider>
  );
}

export default App;
