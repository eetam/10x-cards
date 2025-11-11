"use client";

import * as React from "react";
import { Button } from "../ui/button";
import type { ReactNode } from "react";

interface PrimaryActionButtonProps {
  label: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "outline";
}

/**
 * PrimaryActionButton component - CTA button wrapper
 */
export function PrimaryActionButton({ label, href, icon, disabled, variant = "default" }: PrimaryActionButtonProps) {
  if (disabled) {
    return (
      <Button variant={variant} size="lg" disabled className="w-full">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </Button>
    );
  }

  return (
    <Button variant={variant} size="lg" asChild className="w-full">
      <a href={href}>
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </a>
    </Button>
  );
}
