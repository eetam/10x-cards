"use client";

import * as React from "react";
import { DashboardIllustration } from "./DashboardIllustration";

/**
 * DashboardHero component - Welcome header with app name, description, and illustration
 */
export function DashboardHero() {
  return (
    <div className="text-center space-y-6 mb-12">
      <DashboardIllustration />
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
          10xCards
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Aplikacja do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem AI. Ucz się efektywnie metodą powtórek
          interwałowych.
        </p>
      </div>
    </div>
  );
}
