import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Tags,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  CheckSquare,
  Square,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import {
  useShowcases,
  useCreateShowcase,
  useUpdateShowcase,
  useDeleteShowcase,
  type Showcase,
} from "@/hooks/useShowcases";
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  type Tag,
} from "@/hooks/useTags";
import {
  useCreateCollection,
  useCreateCollectionItem,
  useCollections, 
  useCollection
} from "@/hooks/useCollections";

type DrawerMode = "create" | "edit";

type ShowcaseFormState = {
  title: string;
  url: string;
  description: string;
  tagIds: number[];
};

const normalizeTagName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export function ShowcasesPage() {
  const { data: showcasesData, isLoading, error } = useShowcases();
  const { data: tagsData } = useTags();

  const showcases = Array.isArray(showcasesData) ? showcasesData : [];
  const tags = Array.isArray(tagsData) ? tagsData : [];

  const createShowcase = useCreateShowcase();
  const updateShowcase = useUpdateShowcase();
  const deleteShowcase = useDeleteShowcase();

  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTagSlugs, setActiveTagSlugs] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingShowcase, setEditingShowcase] = useState<Showcase | null>(null);

  const createCollection = useCreateCollection();
  const createCollectionItem = useCreateCollectionItem();

  const [collectionDrawerOpen, setCollectionDrawerOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionBrief, setCollectionBrief] = useState("");

  const [form, setForm] = useState<ShowcaseFormState>({
    title: "",
    url: "",
    description: "",
    tagIds: [],
  });

  const [tagQuery, setTagQuery] = useState("");
  const [tagManagerQuery, setTagManagerQuery] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const selectedShowcases = useMemo(
    () => showcases.filter((item) => selectedIds.includes(item.id)),
    [showcases, selectedIds]
  );

  const filteredTags = useMemo(() => {
    const q = normalizeTagName(tagManagerQuery);
    if (!q) return tags;
    return tags.filter((tag) => normalizeTagName(tag.name).includes(q));
  }, [tags, tagManagerQuery]);

  const tagSuggestions = useMemo(() => {
    const q = normalizeTagName(tagQuery);
    if (!q) return tags.slice(0, 8);

    return tags
      .filter((tag) => normalizeTagName(tag.name).includes(q))
      .slice(0, 8);
  }, [tags, tagQuery]);

  const exactTagMatch = useMemo(() => {
    const q = normalizeTagName(tagQuery);
    if (!q) return null;
    return tags.find((tag) => normalizeTagName(tag.name) === q) ?? null;
  }, [tags, tagQuery]);

  const visibleShowcases = useMemo(() => {
    const q = search.trim().toLowerCase();

    return showcases.filter((showcase) => {
      const matchesSearch =
        !q ||
        [showcase.title, showcase.url, showcase.description ?? "", ...(showcase.tags?.map((tag) => tag.name) ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesTags =
        activeTagSlugs.length === 0 ||
        activeTagSlugs.every((slug) =>
          (showcase.tags ?? []).some((tag) => tag.slug === slug)
        );

      return matchesSearch && matchesTags;
    });
  }, [showcases, search, activeTagSlugs]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => visibleShowcases.some((item) => item.id === id)));
  }, [visibleShowcases]);

  const resetForm = () => {
    setForm({
      title: "",
      url: "",
      description: "",
      tagIds: [],
    });
    setTagQuery("");
    setEditingShowcase(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEditDrawer = (showcase: Showcase) => {
    setDrawerMode("edit");
    setEditingShowcase(showcase);
    setForm({
      title: showcase.title,
      url: showcase.url,
      description: showcase.description ?? "",
      tagIds: showcase.tags?.map((tag) => tag.id) ?? [],
    });
    setTagQuery("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    resetForm();
  };

  const toggleTagFilter = (slug: string) => {
    setActiveTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleShowcases.map((item) => item.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const removeTagFromForm = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.filter((id) => id !== tagId),
    }));
  };

  const addExistingTagToForm = (tag: Tag) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
    }));
    setTagQuery("");
  };

  const handleCreateTagAndAttach = async () => {
    const normalized = normalizeTagName(tagQuery);
    if (!normalized) return;

    const existing = tags.find((tag) => normalizeTagName(tag.name) === normalized);
    if (existing) {
      addExistingTagToForm(existing);
      return;
    }

    createTag.mutate(
      { name: normalized },
      {
        onSuccess: (createdTag: Tag) => {
          setForm((prev) => ({
            ...prev,
            tagIds: prev.tagIds.includes(createdTag.id)
              ? prev.tagIds
              : [...prev.tagIds, createdTag.id],
          }));
          setTagQuery("");
        },
      }
    );
  };

  const handleSubmitShowcase = () => {
    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      tag_ids: form.tagIds,
    };

    if (!payload.title || !payload.url) return;

    if (drawerMode === "create") {
      createShowcase.mutate(payload, {
        onSuccess: () => {
          closeDrawer();
        },
      });
      return;
    }

    if (editingShowcase) {
      updateShowcase.mutate(
        {
          id: editingShowcase.id,
          data: payload,
        },
        {
          onSuccess: () => {
            closeDrawer();
          },
        }
      );
    }
  };

  const handleDeleteShowcase = (showcase: Showcase) => {
    const ok = window.confirm(`Delete "${showcase.title}"?`);
    if (!ok) return;
    deleteShowcase.mutate(showcase.id);
  };

  const startEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const handleSaveTagEdit = () => {
    if (!editingTagId) return;

    const normalized = normalizeTagName(editingTagName);
    if (!normalized) return;

    updateTag.mutate(
      {
        id: editingTagId,
        data: { name: normalized },
      },
      {
        onSuccess: () => {
          setEditingTagId(null);
          setEditingTagName("");
        },
      }
    );
  };

  const handleDeleteTag = (tag: Tag) => {
    const ok = window.confirm(`Delete tag "${tag.name}"?`);
    if (!ok) return;
    deleteTag.mutate(tag.id);
  };

  const allVisibleSelected =
    visibleShowcases.length > 0 &&
    visibleShowcases.every((item) => selectedIds.includes(item.id));

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
        Failed to load showcases.
      </div>
    );
  }

  const handleCreateCollectionFromSelected = async () => {
    const name = collectionName.trim();
    const brief = collectionBrief.trim();

    if (!name || selectedIds.length === 0) return;

    createCollection.mutate(
      { name, brief },
      {
        onSuccess: async (createdCollection) => {
          try {
            await Promise.all(
              selectedIds.map((showcaseId) =>
                createCollectionItem.mutateAsync({
                  collection_id: createdCollection.id,
                  showcase_id: showcaseId,
                  status: "selected",
                })
              )
            );

            setCollectionDrawerOpen(false);
            setCollectionName("");
            setCollectionBrief("");
            setSelectedIds([]);
          } catch (e) {
            console.error("Failed to attach some showcases to collection", e);
          }
        },
      }
    );
  };

  const { data: collectionsData } = useCollections();
  const collections = Array.isArray(collectionsData) ? collectionsData : [];

  const [existingCollectionDrawerOpen, setExistingCollectionDrawerOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<number | "">("");

  const { data: targetCollection } = useCollection(
    typeof targetCollectionId === "number" ? targetCollectionId : null
  );

  const handleAddSelectedToExistingCollection = async () => {
    if (!targetCollectionId || !selectedIds.length) return;

    const existingShowcaseIds = new Set(
      (targetCollection?.items ?? []).map((item) => item.showcase.id)
    );

    const showcaseIdsToAdd = selectedIds.filter((id) => !existingShowcaseIds.has(id));

    if (showcaseIdsToAdd.length === 0) {
      window.alert("All selected showcases are already in this collection.");
      return;
    }

    try {
      await Promise.all(
        showcaseIdsToAdd.map((showcaseId) =>
          createCollectionItem.mutateAsync({
            collection_id: Number(targetCollectionId),
            showcase_id: showcaseId,
            status: "selected",
          })
        )
      );

      setExistingCollectionDrawerOpen(false);
      setTargetCollectionId("");
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to add showcases to collection", error);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Showcase management
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Manage your inspiration library
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Search websites, manage tags, edit references, and prepare selections for future collections.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search showcases..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none ring-0 transition placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
            >
              <Plus className="h-4 w-4" />
              New showcase
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTagSlugs([])}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              activeTagSlugs.length === 0
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
            ].join(" ")}
          >
            All
          </button>

          {tags.map((tag) => {
            const active = activeTagSlugs.includes(tag.slug);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagFilter(tag.slug)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                ].join(" ")}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="rounded-[24px] border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedIds.length} showcase{selectedIds.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Create a collection or add to existing collection.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCollectionDrawerOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
              >
                <FolderPlus className="h-4 w-4" />
                Create collection
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetCollectionId("");
                  setExistingCollectionDrawerOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <FolderPlus className="h-4 w-4" />
                Add to existing collection
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                Clear selection
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Showcases
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {visibleShowcases.length} result{visibleShowcases.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {allVisibleSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select all
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Loading showcases...
            </div>
          ) : visibleShowcases.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-white/10">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No showcases found
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try another search, remove filters, or create your first showcase.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleShowcases.map((showcase) => {
                const selected = selectedIds.includes(showcase.id);

                return (
                  <div
                    key={showcase.id}
                    className={[
                      "group rounded-3xl border p-4 transition",
                      selected
                        ? "border-violet-400 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => toggleSelect(showcase.id)}
                        className="mt-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
                      >
                        {selected ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openEditDrawer(showcase)}
                              className="truncate text-left text-base font-semibold text-slate-950 transition hover:text-violet-600 dark:text-white dark:hover:text-violet-300"
                            >
                              {showcase.title}
                            </button>

                            <a
                              href={showcase.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {showcase.url}
                            </a>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {showcase.description || "No description provided."}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(showcase.tags ?? []).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDrawer(showcase)}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteShowcase(showcase)}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-100 p-2 dark:bg-white/10">
                <Tags className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Tag manager
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create, rename, and delete tags
                </p>
              </div>
            </div>

            <div className="mt-4">
              <input
                value={tagManagerQuery}
                onChange={(e) => setTagManagerQuery(e.target.value)}
                placeholder="Search tags..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="mt-4 flex max-h-[420px] flex-col gap-2 overflow-auto pr-1">
              {filteredTags.map((tag) => {
                const isEditing = editingTagId === tag.id;

                return (
                  <div
                    key={tag.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveTagEdit}
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-medium text-white dark:bg-white dark:text-slate-950"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingTagName("");
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            #{tag.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tag.slug}
                          </p>
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEditTag(tag)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTag(tag)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredTags.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  No tags found.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324] sm:w-[70vw]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-300">
                  {drawerMode === "create" ? "Create showcase" : "Edit showcase"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {drawerMode === "create"
                    ? "Add a new inspiration site"
                    : editingShowcase?.title ?? "Update showcase"}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Fill the details, attach tags, and save your showcase.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-6">
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Stripe landing page"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    URL
                  </label>
                  <input
                    value={form.url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://example.com"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={5}
                    placeholder="What makes this site useful as inspiration?"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    Tags
                  </label>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex flex-wrap gap-2">
                      {form.tagIds.map((tagId) => {
                        const tag = tags.find((item) => item.id === tagId);
                        if (!tag) return null;

                        return (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200"
                          >
                            #{tag.name}
                            <button
                              type="button"
                              onClick={() => removeTagFromForm(tag.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>

                    <div className="relative mt-3">
                      <input
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value)}
                        placeholder="Type to search or create a tag..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />

                      {tagQuery.trim() && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#111a2d]">
                          <div className="max-h-60 overflow-auto">
                            {tagSuggestions
                              .filter((tag) => !form.tagIds.includes(tag.id))
                              .map((tag) => (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => addExistingTagToForm(tag)}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                                >
                                  <span>#{tag.name}</span>
                                  <span className="text-xs text-slate-400">existing</span>
                                </button>
                              ))}

                            {!exactTagMatch && normalizeTagName(tagQuery) && (
                              <button
                                type="button"
                                onClick={handleCreateTagAndAttach}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-violet-700 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                              >
                                <span>Create tag “{normalizeTagName(tagQuery)}”</span>
                                <span className="text-xs">new</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSubmitShowcase}
                  disabled={
                    createShowcase.isPending ||
                    updateShowcase.isPending ||
                    !form.title.trim() ||
                    !form.url.trim()
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {drawerMode === "create"
                    ? createShowcase.isPending
                      ? "Creating..."
                      : "Create showcase"
                    : updateShowcase.isPending
                    ? "Saving..."
                    : "Save changes"}
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
      {collectionDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324] sm:w-[55vw]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                  Create collection
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Create collection from selection
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {selectedIds.length} selected showcase{selectedIds.length > 1 ? "s" : ""} will be added to this collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCollectionDrawerOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Collection name
                </label>
                <input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="Client dashboard inspiration"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Brief
                </label>
                <textarea
                  rows={5}
                  value={collectionBrief}
                  onChange={(e) => setCollectionBrief(e.target.value)}
                  placeholder="Why are these references grouped together?"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Selected showcases
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedShowcases.map((showcase) => (
                    <span
                      key={showcase.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      {showcase.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCreateCollectionFromSelected}
                  disabled={
                    createCollection.isPending ||
                    createCollectionItem.isPending ||
                    !collectionName.trim() ||
                    selectedIds.length === 0
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createCollection.isPending || createCollectionItem.isPending
                    ? "Creating..."
                    : "Create collection"}
                </button>

                <button
                  type="button"
                  onClick={() => setCollectionDrawerOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {existingCollectionDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b1324] sm:w-[55vw]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                  Add to existing collection
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Add selected showcases
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {selectedIds.length} selected showcase{selectedIds.length > 1 ? "s" : ""} will be added to an existing collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExistingCollectionDrawerOpen(false);
                  setTargetCollectionId("");
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Collection
                </label>
                <select
                  value={targetCollectionId}
                  onChange={(e) =>
                    setTargetCollectionId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="">Select collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              {targetCollection && (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Existing items in this collection
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {(targetCollection.items ?? []).length} item{(targetCollection.items ?? []).length !== 1 ? "s" : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(targetCollection.items ?? []).slice(0, 20).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                      >
                        {item.showcase.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Selected showcases
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedShowcases.map((showcase) => (
                    <span
                      key={showcase.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      {showcase.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleAddSelectedToExistingCollection}
                  disabled={
                    !targetCollectionId ||
                    selectedIds.length === 0 ||
                    createCollectionItem.isPending
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createCollectionItem.isPending ? "Adding..." : "Add to collection"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExistingCollectionDrawerOpen(false);
                    setTargetCollectionId("");
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
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