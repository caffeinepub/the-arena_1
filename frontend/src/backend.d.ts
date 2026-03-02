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
export type ContentId = string;
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    contentId: ContentId;
    text: string;
    author: Principal;
    timestamp: bigint;
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
export interface UserProfile {
    name: string;
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
    deleteComment(contentId: ContentId, commentId: CommentId): Promise<void>;
    deleteContent(contentId: ContentId): Promise<void>;
    deleteUserProfile(): Promise<void>;
    editProfile(updatedProfile: UserProfile): Promise<void>;
    getAllContent(_start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(contentId: ContentId): Promise<Array<Comment>>;
    getContent(id: string): Promise<ContentMetadata>;
    getContentBySearchCriteria(criteria: SearchCriteria, _start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getLikesCount(contentId: ContentId): Promise<bigint>;
    getPlaybackQueue(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasUserLikedContent(contentId: ContentId, user: Principal): Promise<boolean>;
    incrementViews(id: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    moveItemInQueue(fromIndex: bigint, toIndex: bigint): Promise<void>;
    removeFromQueue(index: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLike(contentId: ContentId): Promise<void>;
    uploadContent(id: string, title: string, description: string, fileType: FileType, contentBlob: ExternalBlob, thumbnailBlob: ExternalBlob | null, albumCoverBlob: ExternalBlob | null): Promise<void>;
}
