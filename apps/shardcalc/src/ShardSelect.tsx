import { createMemo, createSignal } from "solid-js";
import { ShardGroupTabContent } from "./ShardGroupTabContent";
import type { ShardViewModel, ShardGroup, ShardView } from "./view";
import type { HistoryControls } from "./history";
import "./ShardSelect.css";

interface GroupType {
  groupTypeName: string;
  groups: ShardGroup[];
}

export function ShardSelect(props: { vm: ShardViewModel; selectedShard: string; history: HistoryControls }) {
  const groupTypes: GroupType[] = [
    {
      groupTypeName: "Rarity",
      groups: props.vm.rarityGroups,
    },
    {
      groupTypeName: "Category",
      groups: props.vm.categoryGroups,
    },
    {
      groupTypeName: "Skill",
      groups: props.vm.skillGroups,
    },
    {
      groupTypeName: "Family",
      groups: props.vm.familyGroups,
    },
    {
      groupTypeName: "Source Type",
      groups: props.vm.sourceTypeGroups,
    },
    {
      groupTypeName: "Echo Group",
      groups: props.vm.tagGroups,
    },
  ];

  const [searchTerm, setSearchTerm] = createSignal("");
  const [groupType, setGroupType] = createSignal(-1);
  const [group, setGroup] = createSignal(-1);

  const groupOptions = createMemo(() => {
    if (groupType() === -1) return [];
    return groupTypes[groupType()].groups.map((g, index) => ({
      label: g.groupName,
      value: index,
    }));
  });
  const groupName = createMemo(() => {
    if (groupType() === -1 || group() === -1) return "";
    return groupTypes[groupType()].groups[group()].groupName;
  });
  const groupShards = createMemo(() => {
    if (groupType() === -1 || group() === -1) return [];
    return groupTypes[groupType()].groups[group()].shardIds.map((id) => props.vm.getShard(id));
  });

  function handleSetGroupType(index: number) {
    setGroupType(index);
    setGroup(-1);
  }

  function getFilteredShards() {
    setGroupType(-1);
    const term = searchTerm().toLowerCase();
    return props.vm.shardIds.filter((shardId) => {
      const shard = props.vm.getShard(shardId);
      return (
        shard.id.toLowerCase().includes(term) ||
        shard.name.toLowerCase().includes(term) ||
        shard.rarity.toLowerCase().includes(term) ||
        shard.attributeName.toLowerCase().includes(term) ||
        (shard.families && Object.keys(shard.families).some((family) => family.toLowerCase().includes(term)))
      );
    });
  }

  return (
    <div>
      <div class="history-controls">
        <button disabled={!props.history.canGoBack()} onClick={props.history.goBack}>
          Back
        </button>
        <button disabled={!props.history.canGoForward()} onClick={props.history.goForward}>
          Forward
        </button>
      </div>
      <div class="selected-shard">Selected Shard: {props.selectedShard || "None"}</div>
      <input
        type="text"
        placeholder="Search shards..."
        value={searchTerm()}
        onInput={(e) => setSearchTerm(e.currentTarget.value)}
      />
      <div class="shard-search-menus">
        <div class="shard-group-type-tabs">
          {groupTypes.map((type, i) => (
            <div class="shard-group-type-tab" onClick={() => handleSetGroupType(i)}>
              <h3>{type.groupTypeName}</h3>
            </div>
          ))}
        </div>
        {groupType() !== -1 && (
          <div class="shard-group-tabs">
            {groupOptions().map((option, i) => (
              <div class="shard-group-tab" onClick={() => setGroup(option.value)}>
                <h3>{option.label}</h3>
              </div>
            ))}
          </div>
        )}
        {groupType() !== -1 && group() !== -1 && (
          <ShardGroupTabContent
            groupName={groupName()}
            shards={groupShards()}
            selectedShard={props.selectedShard}
            onSelect={props.history.selectNewShard}
          />
        )}
      </div>
    </div>
  );
}
