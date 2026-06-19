"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { useLogin } from "@/entities/auth/hooks/mutation/use-login.mutation";

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { token } = useAuthData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loginMutation = useLogin();

  useEffect(() => {
    if (token) {
      navigate("/admin");
    }
  }, [navigate, token]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Введите корпоративную почту.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Почта выглядит некорректно.";
    }

    if (!password) {
      nextErrors.password = "Введите пароль.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMutation.isPending) return;

    setFormError("");

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          if (data.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/contracts");
          }
        },
        onError: () => {
          setFormError(
            "Не получилось войти. Проверьте почту и пароль, затем попробуйте еще раз."
          );
        },
      }
    );
  };

  return (
    <Card className="relative w-full gap-0 overflow-hidden rounded-md border-[#e5e7eb] !bg-white py-0 shadow-[0_24px_64px_rgba(34,49,55,0.10)]">
      <div className="h-1 w-full bg-[#f38810]" />
      <CardHeader className="border-b border-[#f1f5f9] px-7 pb-6 pt-7">
        <CardTitle className="text-4xl font-semibold leading-tight tracking-normal text-[#223137]">
          Войти в CRM
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#71717a]">
          Используйте корпоративную почту и пароль.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 px-7 pt-4">
          {formError && (
            <div
              className="flex items-start gap-2 rounded-md border border-[#f1c8bc] bg-[#fff7f3] px-3 py-2.5 text-sm leading-5 text-[#9a3a1b]"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#f38810]" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#f1f5f9]" />
            <p className="text-xs font-medium text-[#71717a]">
              Данные аккаунта
            </p>
            <div className="h-px flex-1 bg-[#f1f5f9]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-[#223137]">
              Почта
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8f98]" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`h-12 rounded-md bg-white pl-10 text-[#223137] shadow-sm shadow-[#223137]/5 placeholder:text-[#9ca3af] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20 ${
                  fieldErrors.email
                    ? "border-[#e7a08a] bg-[#fffaf7]"
                    : "border-[#e5e7eb]"
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                disabled={loginMutation.isPending}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <p
                id="email-error"
                className="flex items-center gap-1.5 text-xs font-medium text-[#b24720]"
                role="alert"
              >
                <AlertCircle className="size-3.5" />
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#223137]"
              >
                Пароль
              </Label>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8f98]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                className={`h-12 rounded-md bg-white pl-10 pr-11 text-[#223137] shadow-sm shadow-[#223137]/5 placeholder:text-[#9ca3af] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20 ${
                  fieldErrors.password
                    ? "border-[#e7a08a] bg-[#fffaf7]"
                    : "border-[#e5e7eb]"
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                disabled={loginMutation.isPending}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#8a8f98] transition-colors hover:bg-[#f5f5f5] hover:text-[#f38810] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f38810]/30"
                onClick={() => setShowPassword((value) => !value)}
                disabled={loginMutation.isPending}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p
                id="password-error"
                className="flex items-center gap-1.5 text-xs font-medium text-[#b24720]"
                role="alert"
              >
                <AlertCircle className="size-3.5" />
                {fieldErrors.password}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch px-7 pb-7 pt-1">
          <Button
            className="mt-4 h-12 w-full rounded-md bg-[#f38810] text-sm font-semibold text-white shadow-sm shadow-[#223137]/10 hover:bg-[#d97706]"
            type="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Входим...
              </>
            ) : (
              <>
                <span>Войти</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
