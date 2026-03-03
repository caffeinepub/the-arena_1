import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type ContentId = string;
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    contentId: ContentId;
    text: string;
    author: Principal;
    timestamp: bigint;
}
export type PostId = bigint;
export interface Counts {
    followers: bigint;
    following: bigint;
}
export interface ContentMetadata {
    id: ContentId;
    title: string;
    contentBlob: ExternalBlob;
    views: bigint;
    description: string;
    fileType: FileType;
    likes: bigint;
    albumCoverBlob?: ExternalBlob;
    thumbnailBlob?: ExternalBlob;
    uploader: Principal;
    comments: bigint;
    uploadTime: bigint;
}
export type SearchCriteria = {
    __kind__: "mostPopular";
    mostPopular: null;
} | {
    __kind__: "byFileType";
    byFileType: FileType;
} | {
    __kind__: "byUploader";
    byUploader: Principal;
} | {
    __kind__: "recent";
    recent: null;
};
export interface Post {
    id: PostId;
    media?: ExternalBlob;
    content: string;
    author: Principal;
    likes: bigint;
    timestamp: bigint;
}
export interface UserProfile {
    bio?: string;
    name: string;
    profilePicture?: Uint8Array;
    counts: Counts;
}
export enum FileType {
    audioMp3 = "audioMp3",
    audioWav = "audioWav",
    videoWebM = "videoWebM",
    videoMP4 = "videoMP4",
    videoMov = "videoMov"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(contentId: ContentId, text: string): Promise<CommentId>;
    addToQueue(contentId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearQueue(): Promise<void>;
    createThought(content: string, media: ExternalBlob | null): Promise<PostId>;
    deleteComment(contentId: ContentId, commentId: CommentId): Promise<void>;
    deleteContent(contentId: ContentId): Promise<void>;
    deleteThought(thoughtId: PostId): Promise<void>;
    deleteUserProfile(): Promise<void>;
    editProfile(updatedProfile: UserProfile): Promise<void>;
    followUser(target: Principal): Promise<void>;
    getAllContent(_start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getAllThoughts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(contentId: ContentId): Promise<Array<Comment>>;
    getContent(id: string): Promise<ContentMetadata>;
    getContentBySearchCriteria(criteria: SearchCriteria, _start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getCounts(user: Principal): Promise<Counts | null>;
    getLikesCount(contentId: ContentId): Promise<bigint>;
    getMyThoughts(): Promise<Array<Post>>;
    getPlaybackQueue(): Promise<Array<string>>;
    getProfilePicture(user: Principal): Promise<Uint8Array | null>;
    getThought(thoughtId: PostId): Promise<Post>;
    getThoughtsByUser(user: Principal): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasUserLikedContent(contentId: ContentId, user: Principal): Promise<boolean>;
    incrementViews(id: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(target: Principal): Promise<boolean>;
    likeThought(thoughtId: PostId): Promise<void>;
    moveItemInQueue(fromIndex: bigint, toIndex: bigint): Promise<void>;
    removeFromQueue(index: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLike(contentId: ContentId): Promise<void>;
    unfollowUser(target: Principal): Promise<void>;
    updateProfilePicture(picture: Uint8Array | null): Promise<void>;
    updateThought(thoughtId: PostId, content: string, media: ExternalBlob | null): Promise<void>;
    uploadContent(id: string, title: string, description: string, fileType: FileType, contentBlob: ExternalBlob, thumbnailBlob: ExternalBlob | null, albumCoverBlob: ExternalBlob | null): Promise<void>;
}
