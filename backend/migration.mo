import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import List "mo:core/List";

module {
  type OldActor = {
    followees : Map.Map<Principal, Set.Set<Principal>>;
  };

  type NewActor = {
    followees : Map.Map<Principal, Set.Set<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    { old with followees = old.followees };
  };
};
