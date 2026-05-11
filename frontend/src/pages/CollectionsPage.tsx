import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  FolderKanban,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Layers3,
  FileText,
  CheckCircle2,
  Clock3,
  Ban,
  Sparkles,
} from "lucide-react";
import {
  useCollections,
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
  useUpdateCollectionItem,
  useDeleteCollectionItem,
  type CollectionListItem,
  type CollectionItem,
  type CollectionItemStatus,
} from "@/hooks/useCollections";

type DrawerMode = "create" | "edit";

type CollectionForm = {
  name: string;
  brief: string;
};

type ItemModalMode = "none" | "move" | "edit";

type ItemDraft = {
  item: CollectionItem;
  status: CollectionItemStatus;
  selection_reason: string;
  review_note: string;
  removal_reason: string;
};

const statusOptions: {
  value: CollectionItemStatus;
  label: string;
}[] = [
  { value: "selected", label: "Selected" },
  { value: "kept", label: "Kept" },
  { value: "removed", label: "Removed" },
  { value: "final_reference", label: "Final reference" },
];

const statusClassMap: Record<CollectionItemStatus, string> = {
  selected:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
  kept:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  removed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  final_reference:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
};

export function CollectionsPage() {
  const { data: collectionsData, isLoading, error } = useCollections();
  const collections = Array.isArray(collectionsData) ? collectionsData : [];

  const [search, setSearch] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingCollection, setEditingCollection] = useState<CollectionListItem | null>(null);

  const [form, setForm] = useState<CollectionForm>({
    name: "",
    brief: "",
  });

  const [itemModalMode, setItemModalMode] = useState<ItemModalMode>("none");
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);

  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const updateCollectionItem = useUpdateCollectionItem();
  const deleteCollectionItem = useDeleteCollectionItem();

  const { data: selectedCollection } = useCollection(selectedCollectionId);

  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const filteredCollections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collections;

    return collections.filter((collection) =>
      [collection.name, collection.brief ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [collections, search]);

  const itemsByStatus = useMemo(() => {
    const map: Record<CollectionItemStatus, CollectionItem[]> = {
      selected: [],
      kept: [],
      removed: [],
      final_reference: [],
    };

    for (const item of selectedCollection?.items ?? []) {
      map[item.status].push(item);
    }

    return map;
  }, [selectedCollection?.items]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingCollection(null);
    setForm({ name: "", brief: "" });
    setDrawerOpen(true);
  };

  const openEditDrawer = (collection: CollectionListItem) => {
    setDrawerMode("edit");
    setEditingCollection(collection);
    setForm({
      name: collection.name,
      brief: collection.brief ?? "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCollection(null);
    setForm({ name: "", brief: "" });
  };

  const handleSaveCollection = () => {
    const payload = {
      name: form.name.trim(),
      brief: form.brief.trim(),
    };

    if (!payload.name) return;
    if (!editingCollection) return;

    updateCollection.mutate(
      {
        id: editingCollection.id,
        data: payload,
      },
      {
        onSuccess: () => {
          closeDrawer();
        },
      }
    );
  };

  const handleDeleteCollection = (collection: CollectionListItem) => {
    const ok = window.confirm(`Delete collection "${collection.name}"?`);
    if (!ok) return;

    deleteCollection.mutate(collection.id, {
      onSuccess: () => {
        if (selectedCollectionId === collection.id) {
          setSelectedCollectionId(null);
        }
      },
    });
  };

  const handleDeleteItem = (item: CollectionItem) => {
    const ok = window.confirm(`Remove "${item.showcase.title}" from this collection?`);
    if (!ok) return;
    deleteCollectionItem.mutate(item.id);
  };

  const openMoveModal = (item: CollectionItem) => {
    setItemDraft({
      item,
      status: item.status,
      selection_reason: item.selection_reason ?? "",
      review_note: item.review_note ?? "",
      removal_reason: item.removal_reason ?? "",
    });
    setItemModalMode("move");
  };

  const openEditModal = (item: CollectionItem) => {
    setItemDraft({
      item,
      status: item.status,
      selection_reason: item.selection_reason ?? "",
      review_note: item.review_note ?? "",
      removal_reason: item.removal_reason ?? "",
    });
    setItemModalMode("edit");
  };

  const closeItemModal = () => {
    setItemModalMode("none");
    setItemDraft(null);
  };

  const handleSaveDraft = () => {
    if (!itemDraft) return;

    const isMove = itemModalMode === "move";
    const newStatus = itemDraft.status;
    const statusChanged = newStatus !== itemDraft.item.status;

    if (isMove && newStatus === "removed" && !itemDraft.removal_reason.trim()) return;
    if (itemDraft.item.status === "removed" && itemModalMode === "edit" && !itemDraft.removal_reason.trim()) return;

    updateCollectionItem.mutate(
      {
        id: itemDraft.item.id,
        data: {
          ...(isMove && statusChanged
            ? {
                status: newStatus,
                reviewed_at: new Date().toISOString(),
              }
            : {}),
          selection_reason: itemDraft.selection_reason.trim() || undefined,
          review_note: itemDraft.review_note.trim() || undefined,
          removal_reason: itemDraft.removal_reason.trim() || undefined,
        },
      },
      { onSuccess: closeItemModal }
    );
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
        Failed to load collections.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Collection management
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Build collections for each project
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Group showcases, review them after meetings, and mark what stays, what goes, and what becomes a final reference.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
            >
              <Plus className="h-4 w-4" />
              New collection
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
          <div className="mb-4 px-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Collections
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredCollections.length} result{filteredCollections.length !== 1 ? "s" : ""}
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
              Loading collections...
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No collections yet
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Create the first collection to start organizing references.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCollections.map((collection) => {
                const active = collection.id === selectedCollectionId;

                return (
                  <div
                    key={collection.id}
                    className={[
                      "rounded-3xl border p-4 transition",
                      active
                        ? "border-cyan-300 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCollectionId(collection.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {collection.name}
                          </p>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                          {collection.brief || "No brief provided."}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                            {collection.items_count} items
                          </span>
                          {active && <ChevronRight className="h-3.5 w-3.5" />}
                        </div>
                      </button>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(collection)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCollection(collection)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-x-auto rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
          {!selectedCollection ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-white/10">
              <Layers3 className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                Select a collection
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Pick a collection on the left to manage its items.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {selectedCollection.name}
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedCollection.brief || "No brief provided yet."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openEditDrawer({
                      id: selectedCollection.id,
                      name: selectedCollection.name,
                      brief: selectedCollection.brief,
                      items_count: selectedCollection.items.length,
                      created_at: selectedCollection.created_at,
                      updated_at: selectedCollection.updated_at,
                    })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                  Edit collection
                </button>
              </div>

              <div className="grid min-w-[900px] grid-cols-4 gap-4">
                {statusOptions.map(({ value, label }) => {
                  const colItems = itemsByStatus[value];
                  const colStyle: Record<CollectionItemStatus, string> = {
                    selected: "border-slate-200 dark:border-white/10",
                    kept: "border-emerald-200 dark:border-emerald-500/20",
                    removed: "border-red-200 dark:border-red-500/20",
                    final_reference: "border-violet-200 dark:border-violet-500/20",
                  };
                  const colHeader: Record<CollectionItemStatus, string> = {
                    selected: "text-slate-700 dark:text-slate-200",
                    kept: "text-emerald-700 dark:text-emerald-300",
                    removed: "text-red-700 dark:text-red-300",
                    final_reference: "text-violet-700 dark:text-violet-300",
                  };

                  return (
                    <div
                      key={value}
                      className={["rounded-[24px] border p-3", colStyle[value]].join(" ")}
                    >
                      <div className="mb-3 flex items-center justify-between px-1">
                        <span
                          className={[
                            "text-xs font-semibold uppercase tracking-wide",
                            colHeader[value],
                          ].join(" ")}
                        >
                          {label}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          {colItems.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {colItems.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
                            No items
                          </div>
                        )}

                        {colItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]"
                          >
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">
                              {item.showcase.title}
                            </p>

                            <a
                              href={item.showcase.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block truncate text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                              {item.showcase.url}
                            </a>

                            {item.reviewed_at && (
                              <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <Clock3 className="h-3 w-3" />
                                {new Date(item.reviewed_at).toLocaleDateString()}
                              </p>
                            )}

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => openMoveModal(item)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                              >
                                Move
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                              >
                                Notes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item)}
                                className="rounded-xl border border-red-200 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(item.showcase.tags ?? []).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {item.status === "kept" && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Kept
                                </span>
                              )}
                              {item.status === "removed" && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                                  <Ban className="h-3.5 w-3.5" />
                                  Removed
                                </span>
                              )}
                              {item.status === "final_reference" && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                                  <FileText className="h-3.5 w-3.5" />
                                  Final reference
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324] sm:w-[60vw]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                  {drawerMode === "create" ? "Create collection" : "Edit collection"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {drawerMode === "create"
                    ? "Add a new project collection"
                    : editingCollection?.name ?? "Update collection"}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Define the project brief and organize related showcase references.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Pharma CRM references"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Brief
                </label>
                <textarea
                  rows={6}
                  value={form.brief}
                  onChange={(e) => setForm((prev) => ({ ...prev, brief: e.target.value }))}
                  placeholder="What is this collection for? What should the team focus on?"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSaveCollection}
                  disabled={
                    drawerMode === "create" ||
                    updateCollection.isPending ||
                    !form.name.trim()
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {updateCollection.isPending ? "Saving..." : drawerMode === "create" ? "Create collection" : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemModalMode === "move" && itemDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">Move item</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                  {itemDraft.item.showcase.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeItemModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Move to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setItemDraft({ ...itemDraft, status: option.value })}
                      className={[
                        "rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
                        itemDraft.status === option.value
                          ? "border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {itemDraft.status === "removed" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    Removal reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={itemDraft.removal_reason}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, removal_reason: e.target.value })
                    }
                    placeholder="Why is this being removed?"
                    className="w-full rounded-2xl border border-red-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 dark:border-red-500/30 dark:bg-white/5 dark:text-white"
                  />
                </div>
              )}

              {(itemDraft.status === "kept" || itemDraft.status === "final_reference") && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    Review note
                  </label>
                  <textarea
                    rows={3}
                    value={itemDraft.review_note}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, review_note: e.target.value })
                    }
                    placeholder="Notes from the review meeting..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={
                    updateCollectionItem.isPending ||
                    itemDraft.status === itemDraft.item.status ||
                    (itemDraft.status === "removed" && !itemDraft.removal_reason.trim())
                  }
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {updateCollectionItem.isPending ? "Saving..." : "Confirm move"}
                </button>
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemModalMode === "edit" && itemDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-300">Edit notes</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                  {itemDraft.item.showcase.title}
                </h3>
                <span
                  className={[
                    "mt-2 inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
                    statusClassMap[itemDraft.item.status],
                  ].join(" ")}
                >
                  {statusOptions.find((s) => s.value === itemDraft.item.status)?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={closeItemModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Selection reason
                </label>
                <textarea
                  rows={3}
                  value={itemDraft.selection_reason}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, selection_reason: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Review note
                </label>
                <textarea
                  rows={3}
                  value={itemDraft.review_note}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, review_note: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Removal reason {itemDraft.item.status === "removed" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={itemDraft.removal_reason}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, removal_reason: e.target.value })
                  }
                  className={[
                    "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none dark:bg-white/5 dark:text-white",
                    itemDraft.item.status === "removed"
                      ? "border-red-300 focus:border-red-400 dark:border-red-500/30"
                      : "border-slate-200 focus:border-violet-400 dark:border-white/10",
                  ].join(" ")}
                />
              </div>

              {itemDraft.item.reviewed_at && (
                <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Reviewed {new Date(itemDraft.item.reviewed_at).toLocaleString()}
                </p>
              )}

              <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={
                    updateCollectionItem.isPending ||
                    (itemDraft.item.status === "removed" && !itemDraft.removal_reason.trim())
                  }
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {updateCollectionItem.isPending ? "Saving..." : "Save notes"}
                </button>
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}