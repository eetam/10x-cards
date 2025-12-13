"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, TrendingUp, CheckCircle2, XCircle, Edit3, Sparkles } from "lucide-react";
import { apiClient } from "../../lib/api/client";

interface AIQualityStats {
  // MS-01: Jakość generacji AI
  totalProposals: number;
  acceptedFlashcards: number;
  aiFullCount: number;
  aiEditedCount: number;
  rejectedProposals: number;
  acceptanceRate: number;
  ms01Target: number;
  ms01Achieved: boolean;

  // MS-02: Adopcja funkcji generowania AI
  totalFlashcards: number;
  aiCreatedFlashcards: number;
  manualFlashcards: number;
  aiAdoptionRate: number;
  ms02Target: number;
  ms02Achieved: boolean;

  // Additional insights
  editRate: number;
  generationsCount: number;
  averageProposalsPerGeneration: number;
}

async function fetchAIQualityStats(): Promise<AIQualityStats> {
  return apiClient.get<AIQualityStats>("/api/admin/ai-quality-stats");
}

interface ProgressBarProps {
  value: number;
  target: number;
  achieved: boolean;
}

function ProgressBar({ value, target, achieved }: ProgressBarProps) {
  const percentage = Math.min(100, value);
  const color = achieved ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{percentage.toFixed(2)}%</span>
        <span className="text-muted-foreground">Cel: {target}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-center gap-2 text-xs">
        {achieved ? (
          <>
            <CheckCircle2 className="size-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Cel osiągnięty</span>
          </>
        ) : (
          <>
            <AlertCircle className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Brakuje {(target - value).toFixed(2)}% do celu</span>
          </>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
}

function StatCard({ title, value, description, icon: Icon, iconColor, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function AIQualityStats() {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ai-quality-stats"],
    queryFn: fetchAIQualityStats,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Błąd</AlertTitle>
        <AlertDescription>Nie udało się pobrać statystyk jakości AI.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Statystyki jakości generacji AI</h1>
        <p className="text-muted-foreground">Metryki sukcesu zgodne z PRD - dostęp tylko przez bezpośredni URL</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Wszystkie propozycje"
          value={stats.totalProposals}
          description="wygenerowane przez AI"
          icon={Sparkles}
          iconColor="text-[#9333ea]"
          bgColor="bg-purple-50 dark:bg-purple-950"
        />
        <StatCard
          title="Zaakceptowane"
          value={stats.acceptedFlashcards}
          description="fiszki w kolekcjach"
          icon={CheckCircle2}
          iconColor="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          title="Liczba generacji"
          value={stats.generationsCount}
          description="wykonanych przez użytkowników"
          icon={TrendingUp}
          iconColor="text-[#2563eb]"
          bgColor="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          title="Średnia propozycji"
          value={stats.averageProposalsPerGeneration.toFixed(1)}
          description="na jedną generację"
          icon={Sparkles}
          iconColor="text-[#ec4899]"
          bgColor="bg-pink-50 dark:bg-pink-950"
        />
      </div>

      {/* MS-01: Jakość generacji AI */}
      <Card>
        <CardHeader>
          <CardTitle>MS-01: Jakość generacji AI</CardTitle>
          <CardDescription>
            Stosunek fiszek zaakceptowanych (w tym edytowanych) do wszystkich zaproponowanych przez AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProgressBar value={stats.acceptanceRate} target={stats.ms01Target} achieved={stats.ms01Achieved} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zaakceptowane bez zmian</p>
                <p className="text-xl font-bold">{stats.aiFullCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Edit3 className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zaakceptowane po edycji</p>
                <p className="text-xl font-bold">{stats.aiEditedCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                <XCircle className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Odrzucone</p>
                <p className="text-xl font-bold">{stats.rejectedProposals}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Procent propozycji wymagających edycji:</span>
              <span className="font-medium">{stats.editRate.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MS-02: Adopcja funkcji generowania AI */}
      <Card>
        <CardHeader>
          <CardTitle>MS-02: Adopcja funkcji generowania AI</CardTitle>
          <CardDescription>
            Procentowy udział fiszek stworzonych przez AI w ogólnej liczbie nowo dodanych fiszek
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProgressBar value={stats.aiAdoptionRate} target={stats.ms02Target} achieved={stats.ms02Achieved} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                <Sparkles className="size-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fiszki z AI</p>
                <p className="text-xl font-bold">{stats.aiCreatedFlashcards}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950">
                <Edit3 className="size-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fiszki manualne</p>
                <p className="text-xl font-bold">{stats.manualFlashcards}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <TrendingUp className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wszystkie fiszki</p>
                <p className="text-xl font-bold">{stats.totalFlashcards}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
