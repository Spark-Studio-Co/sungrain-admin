"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  isLoading: boolean;
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  isLoading,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
}: PaginationProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onFirstPage}
        disabled={currentPage === 1 || isLoading}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onPreviousPage}
        disabled={currentPage === 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onNextPage}
        disabled={currentPage === lastPage || isLoading}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onLastPage}
        disabled={currentPage === lastPage || isLoading}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
