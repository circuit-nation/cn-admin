"use client";

import { DriversManager } from "@/components/admin/drivers-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriversPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <PageHeader 
          title="Drivers Management" 
          description="Manage driver profiles"
        />

        <Card>
          <CardHeader>
            <CardTitle>Drivers</CardTitle>
            <CardDescription>
              Create and manage driver profiles for all competitors across different motorsport categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriversManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
