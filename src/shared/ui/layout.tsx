"use client";

import type React from "react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  ChevronRight,
  FileText,
  Handshake,
  Home,
  Leaf,
  LogOut,
  Menu,
  ShieldCheck,
  TrainFront,
  TrainTrack,
  UserCheck,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { Link } from "react-router-dom";
import { AuthProvider } from "./auth-provider";
import { cn } from "@/lib/utils";

interface ILayout {
  children: React.ReactNode;
  isAdmin?: boolean | null;
}

const adminNavigationItems = [
  {
    title: "Главная",
    eyebrow: "Обзор",
    icon: Home,
    url: "/admin",
  },
  {
    title: "Контракты",
    eyebrow: "Сделки",
    icon: FileText,
    url: "/admin/contracts",
  },
  {
    title: "Финансы",
    eyebrow: "Счета",
    icon: Banknote,
    url: "/admin/finance",
  },
  {
    title: "Пользователи",
    eyebrow: "Доступ",
    icon: Users,
    url: "/admin/users",
  },
  {
    title: "Компании",
    eyebrow: "Партнеры",
    icon: Building2,
    url: "/admin/companies",
  },
  {
    title: "Собственники",
    eyebrow: "Вагоны",
    icon: TrainTrack,
    url: "/admin/owner",
  },
  {
    title: "Культуры",
    eyebrow: "Товары",
    icon: Leaf,
    url: "/admin/cultures",
  },
  {
    title: "Грузоотправитель",
    eyebrow: "Логистика",
    icon: UserCheck,
    url: "/admin/sender",
  },
  {
    title: "Грузополучатель",
    eyebrow: "Логистика",
    icon: Handshake,
    url: "/admin/receiver",
  },
  {
    title: "Станции",
    eyebrow: "Маршруты",
    icon: TrainFront,
    url: "/admin/stations",
  },
];

const userNavigationItems = [
  {
    title: "Контракты",
    eyebrow: "Мои сделки",
    icon: FileText,
    url: "/contracts",
  },
];

const sectionTitles: Record<string, string> = {
  "/admin": "Операционный центр",
  "/admin/contracts": "Контракты",
  "/admin/finance": "Финансы",
  "/admin/users": "Пользователи",
  "/admin/companies": "Компании",
  "/admin/owner": "Собственники",
  "/admin/cultures": "Культуры",
  "/admin/sender": "Грузоотправители",
  "/admin/receiver": "Грузополучатели",
  "/admin/stations": "Станции",
  "/contracts": "Мои контракты",
};

export const Layout: React.FC<ILayout> = ({ children, isAdmin: adminStatus }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { removeRole, removeRequestId, removeUserId, removeToken, role } =
    useAuthData();
  useAutoLogout();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    setIsSidebarOpen(saved === "false" ? false : true);
    setIsAdmin(
      typeof adminStatus === "boolean"
        ? adminStatus
        : localStorage.getItem("isAdmin") === "true"
    );
  }, [adminStatus]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(isSidebarOpen));
  }, [isSidebarOpen]);

  const navigationItems = isAdmin ? adminNavigationItems : userNavigationItems;

  const currentTitle = useMemo(() => {
    const exactTitle = sectionTitles[pathname];

    if (exactTitle) {
      return exactTitle;
    }

    const matched = [...adminNavigationItems, ...userNavigationItems]
      .filter((item) => pathname.startsWith(`${item.url}/`))
      .sort((a, b) => b.url.length - a.url.length)[0];

    return matched?.title ?? "SUNGRAIN CRM";
  }, [pathname]);

  const isCollapsed = !isSidebarOpen;

  const handleLogout = () => {
    removeRequestId();
    removeRole();
    removeUserId();
    removeToken();
    router.replace("/login");
  };

  const isActive = (url: string) => {
    if (url === "/admin") {
      return pathname === "/admin";
    }

    if (url === "/contracts") {
      return pathname === "/contracts" || pathname.startsWith("/contracts/");
    }

    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const isWideWorkspace =
    pathname === "/admin" ||
    pathname === "/admin/contracts" ||
    pathname.startsWith("/admin/contracts/") ||
    pathname === "/admin/finance" ||
    pathname === "/contracts" ||
    pathname.startsWith("/contracts/");

  return (
    <AuthProvider>
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <div className="crm-surface flex min-h-svh w-full">
          <Sidebar
            collapsible="icon"
            className="border-r border-white/10 shadow-[18px_0_48px_rgba(10,24,21,0.18)] [&_[data-sidebar=sidebar]]:bg-[radial-gradient(circle_at_top_left,rgba(243,136,16,0.16),transparent_13rem),linear-gradient(180deg,#1b342f_0%,#132722_52%,#10211d_100%)]"
          >
            <SidebarHeader
              className={cn("px-3 pb-3 pt-4", isCollapsed && "px-1.5 pt-3")}
            >
              <Link
                to={isAdmin ? "/admin" : "/contracts"}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-2.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_34px_rgba(0,0,0,0.14)] transition-colors hover:bg-white/[0.08]",
                  isCollapsed &&
                    "h-11 justify-center rounded-xl border-transparent bg-transparent p-0 shadow-none"
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_10px_22px_rgba(0,0,0,0.2)]",
                    isCollapsed && "size-9 rounded-lg"
                  )}
                >
                  <Image
                    src="/logo.svg"
                    alt="SUNGRAIN"
                    width={isCollapsed ? 25 : 30}
                    height={isCollapsed ? 24 : 29}
                  />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 tracking-normal">
                      SUNGRAIN
                    </p>
                    <p className="text-[10px] uppercase leading-4 text-white/55">
                      Grain logistics CRM
                    </p>
                  </div>
                )}
              </Link>
            </SidebarHeader>

            <SidebarContent className={cn("px-3 pb-2", isCollapsed && "px-1.5")}>
              <SidebarGroup className="p-0">
                {!isCollapsed && (
                  <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase text-white/40">
                    <span>Навигация</span>
                    <span className="h-px w-12 bg-white/10" />
                  </div>
                )}
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {navigationItems.map((item) => {
                      const active = isActive(item.url);

                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.title}
                            className={cn(
                              isCollapsed
                                ? "mx-auto flex size-10 justify-center rounded-xl p-0"
                                : "h-12 rounded-xl px-2.5",
                              active
                                ? isCollapsed
                                  ? "bg-white/[0.105] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.16)] hover:bg-white/[0.13] hover:text-white"
                                  : "relative bg-white/[0.105] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_10px_28px_rgba(0,0,0,0.16)] before:absolute before:left-0 before:top-2.5 before:h-7 before:w-1 before:rounded-r-full before:bg-[#f38810] hover:bg-white/[0.13] hover:text-white"
                                : "text-white/68 hover:bg-white/[0.07] hover:text-white"
                            )}
                          >
                            <Link
                              to={item.url}
                              className={cn(
                                "flex w-full items-center",
                                isCollapsed ? "justify-center" : "gap-2"
                              )}
                            >
                              <span
                                className={
                                  active
                                    ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f38810] text-white shadow-[0_8px_18px_rgba(243,136,16,0.24)]"
                                    : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.055] text-white/70 transition-colors group-hover/menu-item:bg-white/[0.09] group-hover/menu-item:text-white"
                                }
                              >
                                <item.icon className="size-4" />
                              </span>
                              {!isCollapsed && (
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm leading-4">
                                    {item.title}
                                  </span>
                                  <span
                                    className={
                                      active
                                        ? "block truncate text-[10px] font-medium leading-4 text-white/55"
                                        : "block truncate text-[10px] font-medium leading-4 text-white/38"
                                    }
                                  >
                                    {item.eyebrow}
                                  </span>
                                </span>
                              )}
                              {!isCollapsed && (
                                <ChevronRight className="ml-auto size-3.5 opacity-35 transition-transform group-hover/menu-item:translate-x-0.5" />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className={cn("mt-auto px-3 pb-3", isCollapsed && "px-1.5")}>
              {!isCollapsed && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#f38810] text-white shadow-[0_10px_22px_rgba(243,136,16,0.22)]">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#f38810]" />
                        <p className="truncate text-xs font-semibold text-white">
                          {isAdmin ? "Администратор" : "Пользователь"}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] leading-4 text-white/45">
                        {role ?? "Активная сессия"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <SidebarMenu className={cn("mt-2", isCollapsed && "items-center")}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip="Выйти"
                    className={cn(
                      "rounded-xl border border-white/10 bg-white/[0.035] text-white/62 hover:bg-red-500/12 hover:text-red-100",
                      isCollapsed
                        ? "mx-auto flex size-10 justify-center p-0"
                        : "h-10 px-2.5"
                    )}
                  >
                    <LogOut className="size-4" />
                    {!isCollapsed && <span>Выйти</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="min-w-0 bg-transparent">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/88 px-4 backdrop-blur-xl sm:px-6">
              <div className="flex h-16 items-center gap-3">
                <SidebarTrigger className="size-9 rounded-md border border-border/70 bg-card text-foreground shadow-sm">
                  <Menu className="size-4" />
                </SidebarTrigger>
                <Separator orientation="vertical" className="h-7" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
                    SUNGRAIN CRM
                  </p>
                  <h1 className="truncate text-lg font-semibold leading-6 text-foreground">
                    {currentTitle}
                  </h1>
                </div>
                <div className="hidden items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm sm:flex">
                  <span className="size-2 rounded-full bg-[#4d7c5d]" />
                  Online
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden h-9 rounded-md border-border/80 bg-card text-foreground shadow-sm md:inline-flex"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Выйти
                </Button>
              </div>
            </header>
            <main
              className={cn(
                "min-h-0 flex-1 overflow-auto",
                pathname === "/admin" ? "p-0" : "p-3 sm:p-5 lg:p-6"
              )}
            >
              <div
                className={cn(
                  "mx-auto w-full",
                  isWideWorkspace ? "max-w-none" : "max-w-[1540px]"
                )}
              >
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
};
