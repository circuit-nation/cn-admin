"use client";

import { useState, useMemo } from "react";
import { useDrivers, useCreateDriver, useDeleteDriver, useUpdateDriver } from "@/hooks/use-drivers";
import { useSports } from "@/hooks/use-sports";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateDriver, Driver } from "@/lib/schema";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable, createSortableHeader } from "./data-table";
import { ConfirmationDialog } from "./confirmation-dialog";

export function DriversManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterName, setFilterName] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateDriver>({
    id: "",
    name: "",
    image: "",
    sport: "",
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Driver>>({});

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useDrivers(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const createDriver = useCreateDriver({
    onSuccess: () => {
      toast.success("Driver created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteDriver = useDeleteDriver({
    onSuccess: () => {
      toast.success("Driver deleted successfully!");
      setDeleteConfirmOpen(false);
      setDriverToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
      setDriverToDelete(null);
    },
  });

  const updateDriver = useUpdateDriver({
    onSuccess: () => {
      toast.success("Driver updated successfully!");
      setIsEditOpen(false);
      setEditingDriver(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      image: "",
      sport: "",
      tags: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDriver.mutate(formData);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setEditFormData({
      name: driver.name,
      image: driver.image,
      sport: driver.sport,
      tags: driver.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriver) {
      updateDriver.mutate({ id: editingDriver.convexId, data: editFormData });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDriverToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (driverToDelete) {
      deleteDriver.mutate(driverToDelete);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => (
          <Avatar>
            <AvatarImage src={row.original.image} alt={row.original.name} />
            <AvatarFallback>{row.original.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: "sport",
        header: createSortableHeader("Sport"),
        cell: ({ row }) => {
          const sport = sportsData?.documents.find((s) => s.convexId === row.original.sport);
          return sport?.name || "Unknown";
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.tags?.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
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
              onClick={() => handleDeleteClick(row.original.convexId)}
              disabled={deleteDriver.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [sportsData, deleteDriver.isPending]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  const filterComponent = (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by name..."
        value={filterName}
        onChange={(event) => {
          setFilterName(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by sport..."
        value={filterSport}
        onChange={(event) => {
          setFilterSport(event.target.value);
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
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., max-verstappen"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Max Verstappen"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sport">Sport</Label>
                <Select
                  value={formData.sport}
                  onValueChange={(value) => setFormData({ ...formData, sport: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                      {sportsData?.documents.map((sport) => (
                        <SelectItem key={sport.convexId} value={sport.convexId}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="champion, dutch"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createDriver.isPending}>
                {createDriver.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Driver
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Max Verstappen"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-sport">Sport</Label>
              <Select
                value={editFormData.sport}
                onValueChange={(value) => setEditFormData({ ...editFormData, sport: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                    {sportsData?.documents.map((sport) => (
                      <SelectItem key={sport.convexId} value={sport.convexId}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={editFormData.image || ""}
                onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editFormData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="champion, dutch"
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateDriver.isPending}>
              {updateDriver.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Driver
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Driver"
        description="Are you sure you want to delete this driver? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteDriver.isPending}
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
