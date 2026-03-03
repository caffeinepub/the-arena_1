import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { type ContentMetadata, type UserProfile, type FileType, type Comment, type Post, ExternalBlob } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';
import type { Principal } from '@dfinity/principal';

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
      queryClient.invalidateQueries({ queryKey: ['profilePicture'] });
    },
  });
}

export function useEditProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedProfile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editProfile(updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateProfilePicture() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (picture: Uint8Array | null) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProfilePicture(picture);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      if (identity) {
        queryClient.invalidateQueries({
          queryKey: ['profilePicture', identity.getPrincipal().toString()],
        });
      }
    },
  });
}

export function useGetProfilePicture(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const principalStr = principal?.toString();

  return useQuery<Uint8Array | null>({
    queryKey: ['profilePicture', principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getProfilePicture(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDeleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUserProfile();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
      queryClient.invalidateQueries({ queryKey: ['profilePicture'] });
    },
  });
}

// Keep backward-compatible alias
export function useDeleteCallerUserProfile() {
  return useDeleteProfile();
}

export function useGetUserProfile(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const principalStr = principal?.toString();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export function useIsFollowing(targetPrincipal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const targetStr = targetPrincipal?.toString();

  return useQuery<boolean>({
    queryKey: ['isFollowing', targetStr, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !targetPrincipal) return false;
      return actor.isFollowing(targetPrincipal);
    },
    enabled: !!actor && !actorFetching && !!targetPrincipal && !!identity,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.followUser(target);
    },
    onSuccess: (_data, target) => {
      const targetStr = target.toString();
      const callerStr = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', callerStr] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.unfollowUser(target);
    },
    onSuccess: (_data, target) => {
      const targetStr = target.toString();
      const callerStr = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', callerStr] });
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

export function useDeleteContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteContent(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
      queryClient.invalidateQueries({ queryKey: ['contentBySearch'] });
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['playbackQueue'] });
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

// ─── Playback Queue ───────────────────────────────────────────────────────────

export function useGetPlaybackQueue() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['playbackQueue'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlaybackQueue();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddToQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToQueue(contentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbackQueue'] });
    },
  });
}

export function useRemoveFromQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFromQueue(BigInt(index));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbackQueue'] });
    },
  });
}

export function useMoveItemInQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveItemInQueue(BigInt(fromIndex), BigInt(toIndex));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbackQueue'] });
    },
  });
}

export function useClearQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearQueue();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbackQueue'] });
    },
  });
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export function useHasUserLikedContent(contentId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['hasLiked', contentId, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.hasUserLikedContent(contentId, identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity && !!contentId,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.toggleLike(contentId);
    },
    onSuccess: (_data, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['hasLiked', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(contentId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', contentId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(contentId);
    },
    enabled: !!actor && !actorFetching && !!contentId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, text }: { contentId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.addComment(contentId, text);
    },
    onSuccess: (_data, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, commentId }: { contentId: string; commentId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(contentId, commentId);
    },
    onSuccess: (_data, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['allContent'] });
    },
  });
}

// ─── Posts / Thoughts ─────────────────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllThoughts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPostsByUser(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const principalStr = principal?.toString();

  return useQuery<Post[]>({
    queryKey: ['userPosts', principalStr],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getThoughtsByUser(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, media }: { content: string; media: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.createThought(content, media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thoughtId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.deleteThought(thoughtId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thoughtId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.likeThought(thoughtId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}
