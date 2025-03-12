import { QueryClientProvider } from "@tanstack/react-query";
import reactQueryClient from "./shared/api/queryClient";
import { Route, Routes } from "react-router-dom";
import "./index.css";
import { LoginPage } from "./pages/login-page/login-page";

function App() {
  return (
    <>
      <QueryClientProvider client={reactQueryClient}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;
