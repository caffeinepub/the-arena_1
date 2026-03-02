import Set "mo:core/Set";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type ContentId = Text;
  type CommentId = Nat;

  type FileType = {
    #audioMp3;
    #audioWav;
    #videoMP4;
    #videoWebM;
    #videoMov;
  };

  type UserProfile = {
    name : Text;
  };

  type Comment = {
    id : CommentId;
    contentId : ContentId;
    author : Principal;
    timestamp : Int;
    text : Text;
  };

  type ContentMetadata = {
    id : ContentId;
    title : Text;
    description : Text;
    fileType : FileType;
    uploader : Principal;
    uploadTime : Int;
    views : Nat;
    likes : Nat;
    comments : Nat;
    contentBlob : Storage.ExternalBlob;
    thumbnailBlob : ?Storage.ExternalBlob;
    albumCoverBlob : ?Storage.ExternalBlob;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    contentMap : Map.Map<ContentId, ContentMetadata>;
    playbackQueues : Map.Map<Principal, [ContentId]>;
    contentLikes : Map.Map<ContentId, Set.Set<Principal>>;
    comments : Map.Map<ContentId, Map.Map<CommentId, Comment>>;
    nextCommentId : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    contentMap : Map.Map<ContentId, ContentMetadata>;
    playbackQueues : Map.Map<Principal, List.List<ContentId>>;
    contentLikes : Map.Map<ContentId, Set.Set<Principal>>;
    comments : Map.Map<ContentId, Map.Map<CommentId, Comment>>;
    nextCommentId : Nat;
  };

  public func run(old : OldActor) : NewActor = {
    old with
    playbackQueues = old.playbackQueues.map<Principal, [ContentId], List.List<ContentId>>(
      func(_p, a) {
        List.fromArray(a);
      }
    )
  };
};
