import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

export type ShowcaseMini = {
  id: number;
  title: string;
  url: string;
  description?: string;
  tags: Tag[];
};

export type CollectionListItem = {
  id: number;
  name: string;
  brief: string;
  items_count: number;
  created_at: string;
  updated_at: string;
};

export type CollectionItemStatus =
  | "selected"
  | "kept"
  | "removed"
  | "final_reference";

export type CollectionItem = {
  id: number;
  showcase: ShowcaseMini;
  status: CollectionItemStatus;
  selection_reason?: string;
  review_note?: string;
  removal_reason?: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CollectionDetail = {
  id: number;
  name: string;
  brief: string;
  items: CollectionItem[];
  created_at: string;
  updated_at: string;
};

export type CollectionPayload = {
  name: string;
  brief?: string;
};

export type CollectionItemPayload = {
  collection_id?: number;
  showcase_id: number;
  status?: CollectionItemStatus;
  selection_reason?: string;
  review_note?: string;
  removal_reason?: string;
  reviewed_at?: string | null;
};

const extractList = <T,>(data: T[] | PaginatedResponse<T>): T[] => {
  return Array.isArray(data) ? data : data.results ?? [];
};

const fetchCollections = async (): Promise<CollectionListItem[]> => {
  const res = await api.get<CollectionListItem[] | PaginatedResponse<CollectionListItem>>(
    "/collections/"
  );
  return extractList(res.data);
};

const fetchCollection = async (id: number): Promise<CollectionDetail> => {
  const res = await api.get<CollectionDetail>(`/collections/${id}/`);
  return res.data;
};

const createCollection = async (
  payload: CollectionPayload
): Promise<CollectionListItem> => {
  const res = await api.post<CollectionListItem>("/collections/", payload);
  return res.data;
};

const updateCollection = async ({
  id,
  data,
}: {
  id: number;
  data: CollectionPayload;
}): Promise<CollectionListItem> => {
  const res = await api.patch<CollectionListItem>(`/collections/${id}/`, data);
  return res.data;
};

const deleteCollection = async (id: number): Promise<void> => {
  await api.delete(`/collections/${id}/`);
};

const createCollectionItem = async (
  payload: CollectionItemPayload
): Promise<CollectionItem> => {
  const res = await api.post<CollectionItem>("/collection-items/", payload);
  return res.data;
};

const updateCollectionItem = async ({
  id,
  data,
}: {
  id: number;
  data: Partial<CollectionItemPayload>;
}): Promise<CollectionItem> => {
  const res = await api.patch<CollectionItem>(`/collection-items/${id}/`, data);
  return res.data;
};

const deleteCollectionItem = async (id: number): Promise<void> => {
  await api.delete(`/collection-items/${id}/`);
};

export function useCollections() {
  return useQuery<CollectionListItem[]>({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });
}

export function useCollection(id: number | null) {
  return useQuery<CollectionDetail>({
    queryKey: ["collections", "detail", id],
    queryFn: () => fetchCollection(id as number),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        queryKey: ["collections", "detail", variables.id],
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useCreateCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollectionItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      if (variables.collection_id) {
        queryClient.invalidateQueries({
          queryKey: ["collections", "detail", variables.collection_id],
        });
      }
    },
  });
}

export function useUpdateCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollectionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "collections" &&
          query.queryKey[1] === "detail",
      });
    },
  });
}

export function useDeleteCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollectionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "collections" &&
          query.queryKey[1] === "detail",
      });
    },
  });
}