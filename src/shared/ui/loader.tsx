"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoaderProps {
  text?: string;
  variant?: "default" | "minimal" | "card";
  size?: "sm" | "md" | "lg";
}

export const Loader = ({
  text = "Загрузка данных...",
  variant = "default",
  size = "md",
}: LoaderProps) => {
  // Size mappings
  const sizeClasses = {
    sm: {
      spinner: "h-4 w-4",
      text: "text-sm",
      container: "py-2",
    },
    md: {
      spinner: "h-6 w-6",
      text: "text-base",
      container: "py-4",
    },
    lg: {
      spinner: "h-8 w-8",
      text: "text-lg",
      container: "py-6",
    },
  };

  // Minimal variant just shows the spinner and text
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Loader2 className={`animate-spin ${sizeClasses[size].spinner}`} />
        {text && <p className={sizeClasses[size].text}>{text}</p>}
      </div>
    );
  }

  // Card variant shows a card with skeleton content
  if (variant === "card") {
    return (
      <div className="h-[100vh] flex items-center justify-center">
        <Card className="w-full h-[300px] flex items-center justify-center max-w-md mx-auto">
          <CardContent
            className={`flex flex-col items-center ${sizeClasses[size].container}`}
          >
            <Loader2
              className={`animate-spin ${sizeClasses[size].spinner} mb-4 text-primary`}
            />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            {text && (
              <p
                className={`${sizeClasses[size].text} mt-4 text-muted-foreground`}
              >
                {text}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant shows a centered spinner with text and a subtle background
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-muted/20 rounded-lg">
      <div className="flex flex-col items-center p-6 rounded-lg">
        <Loader2
          className={`animate-spin ${sizeClasses[size].spinner} text-primary mb-4`}
        />
        <div className="space-y-3">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        {text && (
          <p className={`${sizeClasses[size].text} mt-4 text-muted-foreground`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};
