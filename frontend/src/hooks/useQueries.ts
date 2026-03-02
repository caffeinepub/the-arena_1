import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { type ContentMetadata, type UserProfile, type FileType, ExternalBlob } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Content Feed ─────────────────────────────────────────────────────────────

export function useGetAllContent(start = 0, limit = 50) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ContentMetadata[]>({
    queryKey: ['allContent', start, limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContent(BigInt(start), BigInt(limit));
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetContent(id: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ContentMetadata>({
    queryKey: ['content', id],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getContent(id);
    },
    enabled: !!actor && !actorFetching && !!id,
  });
}

export function useIncrementViews() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) return;
      return actor.incrementViews(id);
    },
  });
}

// ─── Upload Content ───────────────────────────────────────────────────────────

export interface UploadContentParams {
  id: string;
  title: string;
  description: string;
  fileType: FileType;
  contentBlob: ExternalBlob;
  thumbnailBlob: ExternalBlob | null;
  albumCoverBlob: ExternalBlob | null;
  onProgress?: (pct: number) => void;
}

export function useUploadContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadContentParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadContent(
        params.id,
        params.title,
        params.description,
        params.fileType,
        params.contentBlob,
        params.thumbnailBlob,
        params.albumCoverBlob,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
    },
  });
}
