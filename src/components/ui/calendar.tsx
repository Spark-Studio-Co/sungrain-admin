import * as React from "react";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  locale = ru,
  showOutsideDays = true,
  weekStartsOn = 1,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      className={cn("rounded-md bg-white p-3", className)}
      classNames={{
        months: "flex flex-col gap-2 sm:flex-row",
        month: "flex flex-col gap-3",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label:
          "text-sm font-black capitalize tracking-normal text-[#223137]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 rounded-md border-[#dfe7de] bg-[#fbfcfa] p-0 text-[#53605a] opacity-100 shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "w-9 rounded-md text-center text-[0.72rem] font-black uppercase text-[#7b857f]",
        row: "mt-1.5 flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#fff3e3] [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-md p-0 text-sm font-bold text-[#223137] hover:bg-[#eef5ef] hover:text-[#2f6b4f] aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-[#f38810] aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-[#f38810] aria-selected:text-white",
        day_selected:
          "bg-[#f38810] text-white shadow-[0_8px_18px_rgba(243,136,16,0.24)] hover:bg-[#db790c] hover:text-white focus:bg-[#db790c] focus:text-white",
        day_today: "bg-[#eef5ef] text-[#2f6b4f]",
        day_outside:
          "day-outside text-[#a0aaa5] opacity-70 aria-selected:text-[#a0aaa5]",
        day_disabled: "text-[#a0aaa5] opacity-45",
        day_range_middle:
          "aria-selected:bg-[#fff3e3] aria-selected:text-[#223137]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
