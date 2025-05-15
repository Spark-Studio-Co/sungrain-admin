"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  SunIcon,
  FileIcon,
  LogOut,
  WheatIcon,
  Handshake,
  UserCheck,
  TrainFront,
  GlobeIcon,
  TrainTrack,
} from "lucide-react";
import { useAutoLogout } from "@/hooks/use-auto-logout";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { Link } from "react-router-dom";
import { AuthProvider } from "./auth-provider";

interface ILayout {
  children: React.ReactNode;
}

const navigationItems = [
  {
    title: "Главная",
    icon: Home,
    url: "/admin",
    isAdmin: true,
  },
  {
    title: "Пользователи",
    icon: Users,
    url: "/admin/users",
    isAdmin: true,
  },
  {
    title: "Контракты",
    icon: FileIcon,
    url: "/admin/contracts",
    isAdmin: true,
  },
  {
    title: "Собственники",
    icon: TrainTrack,
    url: "/admin/owner",
    isAdmin: true,
  },
  {
    title: "Контракты",
    icon: FileIcon,
    url: "/contracts",
    isAdmin: false,
  },
  {
    title: "Культуры",
    icon: WheatIcon,
    url: "/admin/cultures",
    isAdmin: true,
  },
  {
    title: "Грузоотправитель",
    icon: UserCheck,
    url: "/admin/sender",
    isAdmin: true,
  },
  {
    title: "Грузополучатель",
    icon: Handshake,
    url: "/admin/receiver",
    isAdmin: true,
  },
  {
    title: "Станции",
    icon: TrainFront,
    url: "/admin/stations",
    isAdmin: true,
  },
  {
    title: "Компании",
    icon: GlobeIcon,
    url: "/admin/companies",
    isAdmin: true,
  },
];

export const Layout: React.FC<ILayout> = ({ children }) => {
  const { removeRole, removeRequestId, removeUserId, removeToken } =
    useAuthData();
  useAutoLogout();

  const [currentPath, setCurrentPath] = useState("");

  const SIDEBAR_STORAGE_KEY = "sidebarOpen";
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved === "false" ? false : true; // default to true
  });
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Update current path when component mounts and when location changes
  useEffect(() => {
    const updateCurrentPath = () => {
      setCurrentPath(window.location.pathname);
    };

    // Set initial path
    updateCurrentPath();

    // Listen for route changes
    window.addEventListener("popstate", updateCurrentPath);

    return () => {
      window.removeEventListener("popstate", updateCurrentPath);
    };
  }, []);

  const handleLogout = () => {
    removeRequestId();
    removeRole();
    removeUserId();
    removeToken();
  };

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Check if a navigation item is active
  const isActive = (url: string) => {
    // Exact match for home page
    if (url === "/admin" && currentPath === "/admin") {
      return true;
    }
    // For other pages, check if the current path starts with the URL
    return url !== "/admin" && currentPath.startsWith(url);
  };

  return (
    <AuthProvider>
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <div className="h-[100vh] flex w-full max-w-[8120px] pr-8">
          <Sidebar>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link to="/">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                        <SunIcon className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold">SUNGRAIN</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Навигации</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems
                      .filter((item) => item.isAdmin === isAdmin)
                      .map((item) => {
                        const active = isActive(item.url);
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              className={
                                active
                                  ? "bg-orange-100 text-orange-400 hover:bg-orange-200 hover:text-orange-700"
                                  : ""
                              }
                            >
                              <a href={item.url}>
                                <item.icon
                                  className={`size-4 ${
                                    active ? "text-orange-600" : ""
                                  }`}
                                />
                                <span>{item.title}</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  >
                    <LogOut className="size-4" />
                    <span>Выйти</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset className="flex flex-col flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger
                className="-ml-1"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="font-semibold">SUNGRAIN | ADMIN PANEL</h1>
            </header>
            <main className="flex-1 overflow-auto p-4">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
};
