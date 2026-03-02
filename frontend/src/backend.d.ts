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
    id: string;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllContent(_start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContent(id: string): Promise<ContentMetadata>;
    getContentBySearchCriteria(criteria: SearchCriteria, _start: bigint, _limit: bigint): Promise<Array<ContentMetadata>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    incrementViews(id: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadContent(id: string, title: string, description: string, fileType: FileType, contentBlob: ExternalBlob, thumbnailBlob: ExternalBlob | null, albumCoverBlob: ExternalBlob | null): Promise<void>;
}
