"use client";

import type React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "xl" | "full";
}

export default function ActionSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = "default",
}: ActionSheetProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "max-w-md";
      case "lg":
        return "max-w-2xl";
      case "xl":
        return "max-w-4xl";
      case "full":
        return "max-w-full";
      default:
        return "max-w-lg";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`${getSizeClass()} p-0 bg-white`}>
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>{title}</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {footer && (
            <SheetFooter className="px-6 py-4 border-t">{footer}</SheetFooter>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
