"use client";

import { useState, useMemo } from "react";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, ArrowUpDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateEvent, EventType, Event } from "@/lib/schema";
import { format } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";

const EVENT_TYPES: EventType[] = [
  "race",
  "qualifying",
  "practice",
  "sprint",
  "test",
  "shootout",
  "warmup",
  "demo",
  "news",
  "announcement",
  "update",
  "watch party",
];

export function EventsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "event_start_at", desc: false }]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [formData, setFormData] = useState<CreateEvent>({
    id: "",
    title: "",
    round: 1,
    type: "race",
    location_str: "",
    sport_id: "",
    country_code: "",
    country: "",
    event_start_at: "",
    event_end_at: "",
    images: [],
  });

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useEvents(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterTitle || undefined,
    filterType || undefined,
    filterLocation || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const createEvent = useCreateEvent({
    onSuccess: () => {
      toast.success("Event created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEvent = useDeleteEvent({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      round: 1,
      type: "race",
      location_str: "",
      sport_id: "",
      country_code: "",
      country: "",
      event_start_at: "",
      event_end_at: "",
      images: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate(formData);
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Event>[]>(() => [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
    },
    {
      accessorKey: "round",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Round
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Badge>{row.original.round}</Badge>,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
    },
    {
      accessorKey: "location_str",
      header: "Location",
      cell: ({ row }) => (
        <div>
          {row.original.location_str}
          <br />
          <span className="text-xs text-muted-foreground">
            {row.original.country} ({row.original.country_code})
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sport_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sport
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const sport = sportsData?.documents.find((s) => s.$id === row.original.sport_id);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "event_start_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          {format(new Date(row.original.event_start_at), "PPp")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteEvent.mutate(row.original.$id)}
          disabled={deleteEvent.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ], [sportsData, deleteEvent]);

  const tableData = useMemo(() => data?.documents || [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil((data?.total || 0) / pagination.pageSize),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., monaco-gp-2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="round">Round</Label>
                  <Input
                    id="round"
                    type="number"
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monaco Grand Prix"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Select
                    value={formData.sport_id}
                    onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportsData?.documents.map((sport) => (
                        <SelectItem key={sport.$id} value={sport.$id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Monaco"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country_code">Country Code</Label>
                  <Input
                    id="country_code"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    placeholder="e.g., MC"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location_str">Location</Label>
                <Input
                  id="location_str"
                  value={formData.location_str}
                  onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                  placeholder="e.g., Circuit de Monaco"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location_id">Location ID (Optional)</Label>
                <Input
                  id="location_id"
                  value={formData.location_id || ""}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  placeholder="Optional: Appwrite location document ID if using separate location collection"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_start_at">Start Date & Time</Label>
                  <Input
                    id="event_start_at"
                    type="datetime-local"
                    value={formData.event_start_at}
                    onChange={(e) => setFormData({ ...formData, event_start_at: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event_end_at">End Date & Time</Label>
                  <Input
                    id="event_end_at"
                    type="datetime-local"
                    value={formData.event_end_at}
                    onChange={(e) => setFormData({ ...formData, event_end_at: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="images">Image URLs (comma-separated)</Label>
                <Input
                  id="images"
                  value={formData.images?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                    })
                  }
                  placeholder="https://image1.jpg, https://image2.jpg"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Filter by title..."
              value={filterTitle}
              onChange={(event) => {
                setFilterTitle(event.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
              }}
              className="max-w-sm"
            />
            <Input
              placeholder="Filter by type..."
              value={filterType}
              onChange={(event) => {
                setFilterType(event.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
              }}
              className="max-w-sm"
            />
            <Input
              placeholder="Filter by location..."
              value={filterLocation}
              onChange={(event) => {
                setFilterLocation(event.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
              }}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="h-12 px-4 text-left align-middle font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data?.total || 0)} of{" "}
                {data?.total || 0} results
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {pagination.pageSize} rows
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[10, 25, 50, 100].map((pageSize) => (
                    <DropdownMenuItem
                      key={pageSize}
                      onClick={() => setPagination(prev => ({ pageIndex: 0, pageSize }))}
                    >
                      {pageSize} rows
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                disabled={pagination.pageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {pagination.pageIndex + 1} of {Math.ceil((data?.total || 0) / pagination.pageSize)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                disabled={pagination.pageIndex >= Math.ceil((data?.total || 0) / pagination.pageSize) - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
