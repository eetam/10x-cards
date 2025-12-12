"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BookOpen, Calendar, Sparkles, TrendingUp } from "lucide-react";
import { apiClient } from "../../lib/api/client";

interface DashboardStats {
  totalFlashcards: number;
  dueToday: number;
  totalGenerations: number;
  studiedToday: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/api/dashboard/stats");
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Wszystkie fiszki",
      value: stats.totalFlashcards,
      description: "w Twojej kolekcji",
      icon: BookOpen,
      iconColor: "text-[#2563eb]",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Do powtórki dziś",
      value: stats.dueToday,
      description: "fiszki wymagające powtórki",
      icon: Calendar,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Generacje AI",
      value: stats.totalGenerations,
      description: "utworzone przez AI",
      icon: Sparkles,
      iconColor: "text-[#9333ea]",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Postęp dziś",
      value: stats.studiedToday,
      description: "fiszek przećwiczonych",
      icon: TrendingUp,
      iconColor: "text-[#ec4899]",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
