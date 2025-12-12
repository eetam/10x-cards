"use client";

import * as React from "react";
import { DashboardIllustration } from "./DashboardIllustration";

/**
 * DashboardHero component - Welcome header with app name, description, and illustration
 */
export function DashboardHero() {
  return (
    <div className="text-center space-y-3 mb-8">
      <DashboardIllustration />
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2563eb] via-[#9333ea] to-[#ec4899] text-transparent bg-clip-text">
          10xCards
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Twórz fiszki edukacyjne z AI. Ucz się efektywnie metodą powtórek interwałowych.
        </p>
      </div>
    </div>
  );
}
