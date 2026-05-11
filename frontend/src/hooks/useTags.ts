import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

type PaginatedTags = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tag[];
};

export type TagPayload = {
  name: string;
};

const normalizeTagName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const fetchTags = async (): Promise<Tag[]> => {
  const res = await api.get<PaginatedTags | Tag[]>("/tags/");
  const data = res.data;
  return Array.isArray(data) ? data : data.results ?? [];
};

const createTag = async (payload: TagPayload): Promise<Tag> => {
  const res = await api.post<Tag>("/tags/", {
    name: normalizeTagName(payload.name),
  });
  return res.data;
};

const updateTag = async ({
  id,
  data,
}: {
  id: number;
  data: TagPayload;
}): Promise<Tag> => {
  const res = await api.patch<Tag>(`/tags/${id}/`, {
    name: normalizeTagName(data.name),
  });
  return res.data;
};

const deleteTag = async (id: number): Promise<void> => {
  await api.delete(`/tags/${id}/`);
};

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}