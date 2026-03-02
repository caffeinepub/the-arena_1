import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type FileType = {
    #audioMp3;
    #audioWav;
    #videoMP4;
    #videoWebM;
    #videoMov;
  };

  type ContentMetadata = {
    id : Text;
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

  module ContentMetadata {
    public func compareByTime(post1 : ContentMetadata, post2 : ContentMetadata) : Order.Order {
      Int.compare(post2.uploadTime, post1.uploadTime);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let contentMap = Map.empty<Text, ContentMetadata>();

  include MixinStorage();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type SearchCriteria = {
    #byUploader : Principal;
    #byFileType : FileType;
    #mostPopular;
    #recent;
  };

  public query ({ caller }) func getContentBySearchCriteria(criteria : SearchCriteria, _start : Nat, _limit : Nat) : async [ContentMetadata] {
    var filtered : Iter.Iter<ContentMetadata> = switch (criteria) {
      case (#byUploader(uploader)) {
        contentMap.values().filter(
          func(content) { content.uploader == uploader }
        );
      };
      case (#byFileType(fileType)) {
        contentMap.values().filter(
          func(content) { content.fileType == fileType }
        );
      };
      case (#mostPopular) {
        return contentMap.values().toArray().sort(
          func(a, b) { Nat.compare(b.views, a.views) }
        );
      };
      case (_) {
        return contentMap.values().toArray().sort(ContentMetadata.compareByTime);
      };
    };
    filtered.toArray();
  };

  public query ({ caller }) func getAllContent(_start : Nat, _limit : Nat) : async [ContentMetadata] {
    contentMap.values().toArray();
  };

  public query ({ caller }) func getContent(id : Text) : async ContentMetadata {
    switch (contentMap.get(id)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) { content };
    };
  };

  public shared ({ caller }) func uploadContent(
    id : Text,
    title : Text,
    description : Text,
    fileType : FileType,
    contentBlob : Storage.ExternalBlob,
    thumbnailBlob : ?Storage.ExternalBlob,
    albumCoverBlob : ?Storage.ExternalBlob,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload content");
    };
    let metadata : ContentMetadata = {
      id;
      title;
      description;
      fileType;
      uploader = caller;
      uploadTime = Time.now();
      views = 0;
      likes = 0;
      comments = 0;
      contentBlob;
      thumbnailBlob;
      albumCoverBlob;
    };
    contentMap.add(id, metadata);
  };

  public shared ({ caller }) func incrementViews(id : Text) : async () {
    switch (contentMap.get(id)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) {
        let updatedContent = {
          content with
          views = content.views + 1;
        };
        contentMap.add(id, updatedContent);
      };
    };
  };
};
