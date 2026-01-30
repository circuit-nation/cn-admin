"use client";

import { TeamsManager } from "@/components/admin/teams-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <PageHeader 
          title="Teams Management" 
          description="Add and manage racing teams"
        />

        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Create and manage teams that compete in various motorsport categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
