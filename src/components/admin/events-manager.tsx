"use client";

import { useState, useMemo, useEffect } from "react";
import { useEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateEvent, EventType, Event } from "@/lib/schema";
import { format } from "date-fns";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable, createSortableHeader } from "./data-table";
import { ConfirmationDialog } from "./confirmation-dialog";

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "event_start_at", desc: false }]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  
  // Debounced filter states
  const [debouncedFilterTitle, setDebouncedFilterTitle] = useState("");
  const [debouncedFilterType, setDebouncedFilterType] = useState("");
  const [debouncedFilterLocation, setDebouncedFilterLocation] = useState("");
  
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
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});

  // Debounce filter values (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterTitle(filterTitle);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterType(filterType);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterLocation(filterLocation);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterLocation]);

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useEvents(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    debouncedFilterTitle || undefined,
    debouncedFilterType || undefined,
    debouncedFilterLocation || undefined
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
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
  });

  const updateEvent = useUpdateEvent({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      setIsEditOpen(false);
      setEditingEvent(null);
      setEditFormData({});
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

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      round: event.round,
      type: event.type,
      location_str: event.location_str,
      sport_id: event.sport_id,
      country_code: event.country_code,
      country: event.country,
      event_start_at: event.event_start_at,
      event_end_at: event.event_end_at,
      images: event.images,
      location_id: event.location_id,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.$id, data: editFormData });
    }
  };

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEvent.mutate(eventToDelete);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        accessorKey: "title",
        header: createSortableHeader("Title"),
        cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
      },
      {
        accessorKey: "round",
        header: createSortableHeader("Round"),
        cell: ({ row }) => <Badge>{row.original.round}</Badge>,
      },
      {
        accessorKey: "type",
        header: createSortableHeader("Type"),
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
        header: createSortableHeader("Sport"),
        cell: ({ row }) => {
          const sport = sportsData?.documents.find((s) => s.$id === row.original.sport_id);
          return sport?.name || "Unknown";
        },
      },
      {
        accessorKey: "event_start_at",
        header: createSortableHeader("Start Date"),
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
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original.$id)}
              disabled={deleteEvent.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [sportsData, deleteEvent.isPending]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  const filterComponent = (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by title..."
        value={filterTitle}
        onChange={(event) => {
          setFilterTitle(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        value={filterType}
        onChange={(event) => {
          setFilterType(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by location..."
        value={filterLocation}
        onChange={(event) => {
          setFilterLocation(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
    </div>
  );

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

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-round">Round</Label>
                <Input
                  id="edit-round"
                  type="number"
                  value={editFormData.round || 1}
                  onChange={(e) => setEditFormData({ ...editFormData, round: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title || ""}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="e.g., Monaco Grand Prix"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value as EventType })}
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
                <Label htmlFor="edit-sport">Sport</Label>
                <Select
                  value={editFormData.sport_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, sport_id: value })}
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
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={editFormData.country || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                  placeholder="e.g., Monaco"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-country_code">Country Code</Label>
                <Input
                  id="edit-country_code"
                  value={editFormData.country_code || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, country_code: e.target.value })}
                  placeholder="e.g., MC"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-location_str">Location</Label>
              <Input
                id="edit-location_str"
                value={editFormData.location_str || ""}
                onChange={(e) => setEditFormData({ ...editFormData, location_str: e.target.value })}
                placeholder="e.g., Circuit de Monaco"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-location_id">Location ID (Optional)</Label>
              <Input
                id="edit-location_id"
                value={editFormData.location_id || ""}
                onChange={(e) => setEditFormData({ ...editFormData, location_id: e.target.value })}
                placeholder="Optional: Appwrite location document ID if using separate location collection"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-event_start_at">Start Date & Time</Label>
                <Input
                  id="edit-event_start_at"
                  type="datetime-local"
                  value={editFormData.event_start_at ? new Date(editFormData.event_start_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditFormData({ ...editFormData, event_start_at: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-event_end_at">End Date & Time</Label>
                <Input
                  id="edit-event_end_at"
                  type="datetime-local"
                  value={editFormData.event_end_at ? new Date(editFormData.event_end_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditFormData({ ...editFormData, event_end_at: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-images">Image URLs (comma-separated)</Label>
              <Input
                id="edit-images"
                value={editFormData.images?.join(", ") || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                  })
                }
                placeholder="https://image1.jpg, https://image2.jpg"
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateEvent.isPending}>
              {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Event
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteEvent.isPending}
      />

      <DataTable
        data={tableData}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        filterComponent={filterComponent}
      />
    </div>
  );
}
