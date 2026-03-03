import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { type ContentMetadata, type UserProfile, type Comment, type Post, type ThoughtComment, type Conversation, type Message, type Participants, ExternalBlob } from '../backend';
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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
  mimeType: string;
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
        params.mimeType,
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

// ─── Thought Comments ─────────────────────────────────────────────────────────

export function useGetThoughtComments(postId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ThoughtComment[]>({
    queryKey: ['thoughtComments', postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getThoughtComments(postId);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddThoughtComment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: bigint; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.addThoughtComment(postId, text);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['thoughtComments', postId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
    },
  });
}

export function useDeleteThoughtComment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, commentId }: { postId: bigint; commentId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.deleteThoughtComment(postId, commentId);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['thoughtComments', postId.toString()] });
    },
  });
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchOnWindowFocus: true,
    refetchInterval: 15000, // Poll every 15 seconds for new messages
  });
}

export function useGetMessages(partner: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const partnerStr = partner?.toString();

  return useQuery<Message[] | null>({
    queryKey: ['messages', partnerStr],
    queryFn: async () => {
      if (!actor || !partner) return null;
      return actor.getMessages(partner);
    },
    enabled: !!actor && !actorFetching && !!partner && !!identity,
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Poll every 10 seconds for new messages in active conversation
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, content }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.sendMessage(recipient, content);
    },
    onSuccess: (_data, { recipient }) => {
      const recipientStr = recipient.toString();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', recipientStr] });
    },
  });
}

export function useMarkMessageAsRead() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationKey,
      messageIndex,
      partnerStr,
    }: {
      conversationKey: Participants;
      messageIndex: bigint;
      partnerStr: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.markMessageAsRead(conversationKey, messageIndex);
    },
    onSuccess: (_data, { partnerStr }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', partnerStr] });
    },
  });
}
