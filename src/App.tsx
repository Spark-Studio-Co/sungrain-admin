import { QueryClientProvider } from "@tanstack/react-query";
import reactQueryClient from "./shared/api/queryClient";
import { Route, Routes } from "react-router-dom";
import "./index.css";
import { LoginPage } from "./pages/login-page/login-page";
import { AdminPage } from "./pages/admin-page/admin-page";

function App() {
  return (
    <>
      <QueryClientProvider client={reactQueryClient}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;
