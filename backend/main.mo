import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ContentId = Text;
  type CommentId = Nat;
  type PostId = Nat;

  type FileType = {
    #audioMp3;
    #audioWav;
    #videoMP4;
    #videoWebM;
    #videoMov;
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

  module ContentMetadata {
    public func compareByTime(post1 : ContentMetadata, post2 : ContentMetadata) : Order.Order {
      Int.compare(post2.uploadTime, post1.uploadTime);
    };
  };

  public type Counts = {
    followers : Nat;
    following : Nat;
  };

  public type UserProfile = {
    name : Text;
    bio : ?Text;
    profilePicture : ?Blob;
    counts : Counts;
  };

  public type Comment = {
    id : CommentId;
    contentId : ContentId;
    author : Principal;
    timestamp : Int;
    text : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let contentMap = Map.empty<ContentId, ContentMetadata>();
  let playbackQueues = Map.empty<Principal, List.List<ContentId>>();
  let contentLikes = Map.empty<ContentId, Set.Set<Principal>>();
  let comments = Map.empty<ContentId, Map.Map<CommentId, Comment>>();
  let followees = Map.empty<Principal, Set.Set<Principal>>();
  var nextCommentId : CommentId = 0;

  // Social/Thoughts functionality
  public type Post = {
    id : PostId;
    author : Principal;
    timestamp : Int;
    content : Text;
    media : ?Storage.ExternalBlob;
    likes : Nat;
  };

  let posts = Map.empty<PostId, Post>();
  var nextPostId : PostId = 1;

  module Post {
    public func compareByTime(post1 : Post, post2 : Post) : Order.Order {
      Int.compare(post2.timestamp, post1.timestamp);
    };
  };

  include MixinStorage();

  // ========================= Follow Functionality =========================

  public shared ({ caller }) func followUser(target : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (target == caller) {
      Runtime.trap("Cannot follow yourself");
    };

    let alreadyFollowing = switch (followees.get(caller)) {
      case (null) { false };
      case (?followingSet) { followingSet.contains(target) };
    };

    if (alreadyFollowing) {
      Runtime.trap("Already following this user");
    };

    let newFollowingSet = switch (followees.get(caller)) {
      case (null) { Set.singleton(target) };
      case (?followingSet) {
        followingSet.add(target);
        followingSet;
      };
    };
    followees.add(caller, newFollowingSet);

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Caller profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          counts = {
            profile.counts with
            following = profile.counts.following + 1;
          };
        };
        userProfiles.add(caller, updatedProfile);
      };
    };

    switch (userProfiles.get(target)) {
      case (null) { Runtime.trap("Target profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          counts = {
            profile.counts with
            followers = profile.counts.followers + 1;
          };
        };
        userProfiles.add(target, updatedProfile);
      };
    };
  };

  // Any authenticated user (including guests) can query follow state;
  // guests will always get false since they have no follows stored.
  public query ({ caller }) func isFollowing(target : Principal) : async Bool {
    switch (followees.get(caller)) {
      case (null) { false };
      case (?followingSet) { followingSet.contains(target) };
    };
  };

  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    let alreadyFollowing = switch (followees.get(caller)) {
      case (null) { false };
      case (?followingSet) { followingSet.contains(target) };
    };

    if (not alreadyFollowing) {
      Runtime.trap("Not following this user");
    };

    let newFollowingSet = switch (followees.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?followingSet) {
        followingSet.remove(target);
        followingSet;
      };
    };

    followees.add(caller, newFollowingSet);

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Caller profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          counts = {
            profile.counts with
            following = if (profile.counts.following > 0) { profile.counts.following - 1 } else { 0 };
          };
        };
        userProfiles.add(caller, updatedProfile);
      };
    };

    switch (userProfiles.get(target)) {
      case (null) { Runtime.trap("Target profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          counts = {
            profile.counts with
            followers = if (profile.counts.followers > 0) { profile.counts.followers - 1 } else { 0 };
          };
        };
        userProfiles.add(target, updatedProfile);
      };
    };
  };

  // ========================= User Profile Functionality =========================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their own profile");
    };
    userProfiles.get(caller);
  };

  // Any caller (including guests) can view any user's public profile,
  // which is necessary for social features like viewing profiles before following.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateProfilePicture(picture : ?Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("You are not authorized to perform this action");
    };

    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    let updatedProfile = {
      userProfile with
      profilePicture = picture;
    };

    userProfiles.add(caller, updatedProfile);
  };

  // Any caller can view a user's profile picture (public social feature)
  public query ({ caller }) func getProfilePicture(user : Principal) : async ?Blob {
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { profile.profilePicture };
    };
  };

  public shared ({ caller }) func editProfile(updatedProfile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit their profile");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("Cannot edit non-existent profile");
    };

    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func deleteUserProfile() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete their profiles");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("Cannot delete non-existent profile");
    };

    userProfiles.remove(caller);

    let toDelete = contentMap.filter(
      func(_id, content) {
        content.uploader == caller;
      }
    );

    for ((id, _) in toDelete.entries()) {
      contentMap.remove(id);
    };

    playbackQueues.remove(caller);

    let entriesToRemove = contentLikes.toArray();
    for ((contentId, likesSet) in entriesToRemove.values()) {
      if (likesSet.contains(caller)) {
        let newLikesSet = Set.empty<Principal>();
        let filtered = likesSet.filter(func(existing) { existing != caller });
        for (item in filtered.values()) {
          newLikesSet.add(item);
        };
        contentLikes.add(contentId, newLikesSet);

        var updatedMetadata = contentMap.get(contentId);
        switch (updatedMetadata) {
          case (null) {};
          case (?content) {
            let updatedLikes = switch (contentLikes.get(contentId)) {
              case (null) { 0 };
              case (?likesSet) { likesSet.size() };
            };
            let newMetadata = {
              content with
              likes = updatedLikes;
            };
            contentMap.add(contentId, newMetadata);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteContent(contentId : ContentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete content");
    };

    switch (contentMap.get(contentId)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) {
        if (content.uploader != caller) {
          Runtime.trap("Unauthorized");
        };
        contentMap.remove(contentId);
      };
    };
  };

  // Content search criteria
  public type SearchCriteria = {
    #byUploader : Principal;
    #byFileType : FileType;
    #mostPopular;
    #recent;
  };

  // Content browsing is public - any caller including guests can search/browse
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

  // Content browsing is public - any caller including guests can list content
  public query ({ caller }) func getAllContent(_start : Nat, _limit : Nat) : async [ContentMetadata] {
    contentMap.values().toArray();
  };

  // Content viewing is public - any caller including guests can get content metadata
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

  // View counting can be done by any caller (guests can view content too)
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

  // Playback queue functions - only authenticated users have queues
  public query ({ caller }) func getPlaybackQueue() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their playback queue");
    };
    switch (playbackQueues.get(caller)) {
      case (null) { [] };
      case (?queue) { queue.toArray() };
    };
  };

  public shared ({ caller }) func addToQueue(contentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to their playback queue");
    };
    let currentQueue = switch (playbackQueues.get(caller)) {
      case (null) { List.empty<Text>() };
      case (?queue) { queue };
    };
    currentQueue.add(contentId);
    playbackQueues.add(caller, currentQueue);
  };

  public shared ({ caller }) func removeFromQueue(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove items from their playback queue");
    };
    let currentQueue = switch (playbackQueues.get(caller)) {
      case (null) { return () };
      case (?queue) { queue };
    };
    if (index >= currentQueue.size()) {
      Runtime.trap("Index out of bounds");
    };
    let arrayRep = currentQueue.toArray();
    let filtered = Array.tabulate(
      if (arrayRep.size() <= 1) { 0 } else { arrayRep.size() - 1 },
      func(i) {
        if (i < index) {
          arrayRep[i];
        } else {
          arrayRep[i + 1];
        };
      },
    );
    let newQueue = List.fromArray(filtered);
    playbackQueues.add(caller, newQueue);
  };

  public shared ({ caller }) func moveItemInQueue(fromIndex : Nat, toIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reorder their playback queue");
    };
    let currentQueue = switch (playbackQueues.get(caller)) {
      case (null) { return () };
      case (?queue) { queue };
    };
    let size = currentQueue.size();
    if (fromIndex >= size or toIndex >= size) {
      Runtime.trap("Index out of bounds");
    };
    let arrayRep = currentQueue.toArray();
    let item = arrayRep[fromIndex];
    let withoutItem = Array.tabulate(
      if (size <= 1) { 0 } else { size - 1 },
      func(i) {
        if (i < fromIndex) {
          arrayRep[i];
        } else {
          arrayRep[i + 1];
        };
      },
    );
    let newArray = Array.tabulate(
      size,
      func(i) {
        if (i < toIndex) {
          withoutItem[i];
        } else if (i == toIndex) {
          item;
        } else {
          withoutItem[i - 1];
        };
      },
    );
    let newQueue = List.fromArray(newArray);
    playbackQueues.add(caller, newQueue);
  };

  public shared ({ caller }) func clearQueue() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their playback queue");
    };
    playbackQueues.add(caller, List.empty<Text>());
  };

  // Like queries are public - any caller can check like counts/state
  public query ({ caller }) func hasUserLikedContent(contentId : ContentId, user : Principal) : async Bool {
    switch (contentLikes.get(contentId)) {
      case (null) { false };
      case (?likesSet) { likesSet.contains(user) };
    };
  };

  public query ({ caller }) func getLikesCount(contentId : ContentId) : async Nat {
    switch (contentLikes.get(contentId)) {
      case (null) { 0 };
      case (?likesSet) { likesSet.size() };
    };
  };

  public shared ({ caller }) func toggleLike(contentId : ContentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like content");
    };
    let _ = switch (contentLikes.get(contentId)) {
      case (null) {
        let newSet = Set.singleton(caller);
        contentLikes.add(contentId, newSet);
        true;
      };
      case (?likesSet) {
        if (likesSet.contains(caller)) {
          likesSet.remove(caller);
          contentLikes.add(contentId, likesSet);
          false;
        } else {
          likesSet.add(caller);
          contentLikes.add(contentId, likesSet);
          true;
        };
      };
    };

    var updatedMetadata = contentMap.get(contentId);
    switch (updatedMetadata) {
      case (null) {};
      case (?content) {
        let updatedLikes = switch (contentLikes.get(contentId)) {
          case (null) { 0 };
          case (?likesSet) { likesSet.size() };
        };
        let newMetadata = {
          content with
          likes = updatedLikes;
        };
        contentMap.add(contentId, newMetadata);
      };
    };
  };

  // Comments functionality
  public shared ({ caller }) func addComment(contentId : ContentId, text : Text) : async CommentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };

    let comment : Comment = {
      id = nextCommentId;
      contentId;
      author = caller;
      timestamp = Time.now();
      text;
    };

    switch (comments.get(contentId)) {
      case (null) {
        let newComments = Map.empty<CommentId, Comment>();
        newComments.add(nextCommentId, comment);
        comments.add(contentId, newComments);
      };
      case (?existingComments) {
        existingComments.add(nextCommentId, comment);
      };
    };

    let content = switch (contentMap.get(contentId)) {
      case (?existingContent) { existingContent };
      case (null) {
        Runtime.trap("Content not found");
      };
    };

    let updatedContent = {
      content with
      comments = content.comments + 1;
    };
    contentMap.add(contentId, updatedContent);

    let currentId = nextCommentId;
    nextCommentId += 1;
    currentId;
  };

  // Comments are public - any caller can read comments
  public query ({ caller }) func getComments(contentId : ContentId) : async [Comment] {
    switch (comments.get(contentId)) {
      case (null) { [] };
      case (?existingComments) {
        existingComments.values().toArray();
      };
    };
  };

  // Delete comment: only the comment author or an admin can delete
  public shared ({ caller }) func deleteComment(contentId : ContentId, commentId : CommentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    let existingComments = switch (comments.get(contentId)) {
      case (null) { Runtime.trap("Comments not found for content") };
      case (?comments) { comments };
    };

    let comment = switch (existingComments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (caller != comment.author and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete your own comments");
    };

    existingComments.remove(commentId);

    let content = switch (contentMap.get(contentId)) {
      case (?existingContent) { existingContent };
      case (null) { Runtime.trap("Content not found") };
    };

    let updatedContent = {
      content with
      comments = if (content.comments > 0) { content.comments - 1 } else { 0 };
    };
    contentMap.add(contentId, updatedContent);
  };

  // Counts are public - any caller can view follower/following counts
  public query ({ caller }) func getCounts(user : Principal) : async ?Counts {
    switch (userProfiles.get(user)) {
      case (?profile) { ?profile.counts };
      case (null) { null };
    };
  };

  // ========================= Social/Thoughts Functionality =========================

  public shared ({ caller }) func createThought(content : Text, media : ?Storage.ExternalBlob) : async PostId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("You are not authorized to perform this action");
    };

    let thought : Post = {
      id = nextPostId;
      author = caller;
      timestamp = Time.now();
      content;
      media;
      likes = 0;
    };

    posts.add(nextPostId, thought);

    let thoughtId = nextPostId;
    nextPostId += 1;
    thoughtId;
  };

  // getAllThoughts is public - any caller including guests can browse posts
  public query ({ caller }) func getAllThoughts() : async [Post] {
    let thoughts = posts.values().toArray();
    thoughts.sort(Post.compareByTime);
  };

  // getThought is public - any caller including guests can view a single post
  public query ({ caller }) func getThought(thoughtId : PostId) : async Post {
    switch (posts.get(thoughtId)) {
      case (null) {
        Runtime.trap("Thought not found");
      };
      case (?thought) {
        thought;
      };
    };
  };

  // getMyThoughts requires #user - it is a personalized endpoint for the caller's own posts
  public query ({ caller }) func getMyThoughts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their own thoughts");
    };
    let thoughts = posts.values().toArray();
    thoughts.filter(func(thought) { thought.author == caller });
  };

  public shared ({ caller }) func deleteThought(thoughtId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete thoughts");
    };
    switch (posts.get(thoughtId)) {
      case (null) {
        Runtime.trap("Thought not found");
      };
      case (?thought) {
        if (thought.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("You are not authorized to delete this thought");
        };
        posts.remove(thoughtId);
      };
    };
  };

  // likeThought requires #user - only authenticated users can like posts
  public shared ({ caller }) func likeThought(thoughtId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like thoughts");
    };
    let thought = switch (posts.get(thoughtId)) {
      case (null) {
        Runtime.trap("Thought not found");
      };
      case (?thought) { thought };
    };

    let updatedThought = {
      thought with
      likes = thought.likes + 1;
    };

    posts.add(thoughtId, updatedThought);
  };

  public shared ({ caller }) func updateThought(thoughtId : PostId, content : Text, media : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("You are not authorized to perform this action");
    };

    switch (posts.get(thoughtId)) {
      case (null) {
        Runtime.trap("Thought not found");
      };
      case (?thought) {
        if (thought.author != caller) {
          Runtime.trap("You are not authorized to update this thought");
        };

        let updatedThought = {
          thought with
          content;
          media;
        };

        posts.add(thoughtId, updatedThought);
      };
    };
  };

  // getThoughtsByUser is public - any caller including guests can view a user's posts
  public query ({ caller }) func getThoughtsByUser(user : Principal) : async [Post] {
    let thoughts = posts.values().toArray();
    thoughts.filter(func(thought) { thought.author == user });
  };
};
