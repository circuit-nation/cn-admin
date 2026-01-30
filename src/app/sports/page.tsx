"use client";

import { SportsManager } from "@/components/admin/sports-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <PageHeader 
          title="Sports Management" 
          description="Create and manage motorsport categories"
        />

        <Card>
          <CardHeader>
            <CardTitle>Sports</CardTitle>
            <CardDescription>
              Add different motorsport categories like Formula 1, MotoGP, IndyCar, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SportsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
