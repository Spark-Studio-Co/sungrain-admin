import { Layout } from "@/shared/ui/layout";
import LoginForm from "@/widget/form/login-form/login-form";

export const LoginPage = () => {
  return (
    <Layout>
      <div className="w-full h-full flex items-center justify-center">
        <LoginForm />
      </div>
    </Layout>
  );
};
