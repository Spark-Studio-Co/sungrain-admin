import { QueryClientProvider } from "@tanstack/react-query";
import reactQueryClient from "./shared/api/queryClient";
import { Route, Routes } from "react-router-dom";
import "./index.css";
import { LoginPage } from "./pages/login-page/login-page";
import ContractsPage from "./pages/contracts-page/contracts-page";
import UsersPage from "./pages/users-page/users-page";
import ContractsInnerPage from "./pages/contracts-inner-page/contracts-inner-page";
import DashboardPage from "./pages/dashboard-page/dashboard-page";

function App() {
  return (
    <>
      <QueryClientProvider client={reactQueryClient}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/contracts" element={<ContractsPage />} />
          <Route path="/admin/contracts/:id" element={<ContractsInnerPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;
