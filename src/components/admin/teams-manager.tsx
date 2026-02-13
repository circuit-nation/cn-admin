"use client";

import { useState, useMemo } from "react";
import { useTeams, useCreateTeam, useDeleteTeam, useUpdateTeam } from "@/hooks/use-teams";
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
import { CreateTeam, Team } from "@/lib/schema";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable, createSortableHeader } from "./data-table";
import { ConfirmationDialog } from "./confirmation-dialog";

export function TeamsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterName, setFilterName] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateTeam>({
    id: "",
    name: "",
    logo: "",
    sport: "",
    tags: [],
    color: "#000000",
  });
  const [editFormData, setEditFormData] = useState<Partial<Team>>({});

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useTeams(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const createTeam = useCreateTeam({
    onSuccess: () => {
      toast.success("Team created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = useDeleteTeam({
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      setDeleteConfirmOpen(false);
      setTeamToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
      setTeamToDelete(null);
    },
  });

  const updateTeam = useUpdateTeam({
    onSuccess: () => {
      toast.success("Team updated successfully!");
      setIsEditOpen(false);
      setEditingTeam(null);
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
      logo: "",
      sport: "",
      tags: [],
      color: "#000000",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate(formData);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setEditFormData({
      name: team.name,
      logo: team.logo,
      sport: team.sport,
      tags: team.tags,
      color: team.color,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      updateTeam.mutate({ id: editingTeam.convexId, data: editFormData });
    }
  };

  const handleDeleteClick = (id: string) => {
    setTeamToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (teamToDelete) {
      deleteTeam.mutate(teamToDelete);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: "logo",
        header: "Logo",
        cell: ({ row }) => (
          <Avatar>
            <AvatarImage src={row.original.logo} alt={row.original.name} />
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
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="text-xs">{row.original.color}</span>
          </div>
        ),
        enableSorting: false,
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
              disabled={deleteTeam.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [sportsData, deleteTeam.isPending]
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
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., red-bull"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Red Bull Racing"
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
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
                  placeholder="f1, championship"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                {createTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Red Bull Racing"
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
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={editFormData.logo || ""}
                onChange={(e) => setEditFormData({ ...editFormData, logo: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={editFormData.color || "#000000"}
                onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
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
                placeholder="f1, championship"
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateTeam.isPending}>
              {updateTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Team
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteTeam.isPending}
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
