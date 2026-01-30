"use client";

import { EventsManager } from "@/components/admin/events-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <PageHeader 
          title="Events Management" 
          description="Schedule and manage racing events"
        />

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Create and manage racing events with full details including location, dates, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
