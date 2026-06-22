import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type FormErrorProps = {
  message?: string;
  className?: string;
};

function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs font-bold leading-5 text-[#c24135]",
        className
      )}
    >
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

export { FormError };
