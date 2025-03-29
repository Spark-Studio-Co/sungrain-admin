"use client";

import type React from "react";
import {
  Home,
  Users,
  SunIcon,
  FileIcon,
  LogOut,
  CoinsIcon,
  WheatIcon,
  Handshake,
  UserCheck,
  TrainFront,
} from "lucide-react";

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

interface ILayout {
  children: React.ReactNode;
}

const navigationItems = [
  {
    title: "Главная",
    icon: Home,
    url: "/admin",
    isAdmin: false,
  },
  {
    title: "Пользователи",
    icon: Users,
    url: "/admin/users",
    isAdmin: false,
  },
  {
    title: "Контракты",
    icon: FileIcon,
    url: "/admin/contracts",
    isAdmin: false,
  },
  {
    title: "Финансы",
    icon: CoinsIcon,
    url: "/admin/finance",
    isAdmin: false,
  },
  {
    title: "Культуры",
    icon: WheatIcon,
    url: "/admin/cultures",
    isAdmin: false,
  },
  {
    title: "Грузоотправитель",
    icon: UserCheck,
    url: "/admin/sender",
    isAdmin: false,
  },
  {
    title: "Грузополучатель",
    icon: Handshake,
    url: "/admin/receiver",
    isAdmin: false,
  },
  {
    title: "Станции",
    icon: TrainFront,
    url: "/admin/stations",
    isAdmin: false,
  },
];

export const Layout: React.FC<ILayout> = ({ children }) => {
  const { removeRole, removeRequestId, removeUserId, removeToken } =
    useAuthData();

  const handleLogout = () => {
    removeRequestId();
    removeRole();
    removeUserId();
    removeToken();
  };

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  return (
    <SidebarProvider>
      <div className="h-[100vh] flex w-full max-w-[1920px] pr-8">
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
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems
                    .filter((item) => item.isAdmin === isAdmin)
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
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
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="font-semibold">SUNGRAIN | ADMIN PANEL</h1>
          </header>
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
