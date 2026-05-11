import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Tag } from "@/hooks/useTags";

export type Showcase = {
  id: number;
  title: string;
  url: string;
  description?: string;
  tags: Tag[];
  created_at?: string;
  updated_at?: string;
};

type PaginatedShowcases = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Showcase[];
};

export type ShowcasePayload = {
  title: string;
  url: string;
  description?: string;
  tag_ids?: number[];
};

const fetchShowcases = async (): Promise<Showcase[]> => {
  const res = await api.get<PaginatedShowcases | Showcase[]>("/showcases/");
  const data = res.data;
  return Array.isArray(data) ? data : data.results ?? [];
};

const createShowcase = async (data: ShowcasePayload): Promise<Showcase> => {
  const res = await api.post<Showcase>("/showcases/", data);
  return res.data;
};

const updateShowcase = async ({
  id,
  data,
}: {
  id: number;
  data: ShowcasePayload;
}): Promise<Showcase> => {
  const res = await api.patch<Showcase>(`/showcases/${id}/`, data);
  return res.data;
};

const deleteShowcase = async (id: number): Promise<void> => {
  await api.delete(`/showcases/${id}/`);
};

export function useShowcases() {
  return useQuery<Showcase[]>({
    queryKey: ["showcases"],
    queryFn: fetchShowcases,
  });
}

export function useCreateShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShowcase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useUpdateShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShowcase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useDeleteShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShowcase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}