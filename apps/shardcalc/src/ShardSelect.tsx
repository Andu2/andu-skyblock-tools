import { createSignal, useContext } from "solid-js";
import type { ShardGroup, ShardView } from "./view";

interface GroupCategory {
  categoryName: string;
  groups: ShardGroup[];
}

import { ShardOption } from "./ShardOption";
import { AppContext } from "./appContext";

function ShardSelectGroup(props: { handleToggleGroup: () => void; group: ShardGroup }) {
  const { vm } = useContext(AppContext);
  return (
    <div>
      <div class="shard-group-header" onClick={() => props.handleToggleGroup()}>
        {props.group.groupName}
      </div>
      {props.group.shardIds.length > 0 && (
        <div class="shard-group">
          {props.group.shardIds.map(vm.getShard).map((shard) => (
            <ShardOption shard={shard} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ShardSelect() {
  const { vm } = useContext(AppContext);
  const groupCategories: GroupCategory[] = [
    {
      categoryName: "Rarity",
      groups: vm.rarityGroups,
    },
    {
      categoryName: "Category",
      groups: vm.categoryGroups,
    },
    {
      categoryName: "Skill",
      groups: vm.skillGroups,
    },
    {
      categoryName: "Family",
      groups: vm.familyGroups,
    },
    {
      categoryName: "Source Type",
      groups: vm.sourceTypeGroups,
    },
    {
      categoryName: "Echo Group",
      groups: vm.tagGroups,
    },
  ];

  const [searchTerm, setSearchTerm] = createSignal("");
  const [groupCategory, setGroupCategory] = createSignal(0);
  const [expandedGroups, setExpandedGroups] = createSignal<boolean[]>(
    Array(groupCategories[0].groups.length).fill(false)
  );

  function handleSetGroupType(index: number) {
    if (index !== groupCategory()) {
      setExpandedGroups(Array(groupCategories[index].groups.length).fill(false));
    }
    setGroupCategory(index);
  }

  function handleToggleGroup(index: number) {
    const newExpandedGroups = [...expandedGroups()];
    newExpandedGroups[index] = !newExpandedGroups[index];
    setExpandedGroups(newExpandedGroups);
  }

  function expandAll() {
    setExpandedGroups(Array(groupCategories[groupCategory()].groups.length).fill(true));
  }

  function collapseAll() {
    setExpandedGroups(Array(groupCategories[groupCategory()].groups.length).fill(false));
  }

  function matchesSearchTerm(shard: ShardView): boolean {
    const term = searchTerm().toLowerCase();
    return !!(
      shard.id.toLowerCase().includes(term) ||
      shard.name.toLowerCase().includes(term) ||
      shard.attributeName.toLowerCase().includes(term) ||
      (shard.families && Object.keys(shard.families).some((family) => family.toLowerCase().includes(term)))
    );
  }

  const filteredShardGroups = () => {
    return groupCategories[groupCategory()].groups.map((group, i) => {
      if (!expandedGroups()[i]) {
        return {
          groupName: group.groupName,
          shardIds: [],
        };
      }
      return {
        groupName: group.groupName,
        shardIds: group.shardIds.filter((shardId) => {
          const shard = vm.getShard(shardId);
          return matchesSearchTerm(shard);
        }),
      };
    });
  };

  const isFiltered = () => {
    return searchTerm().length > 0;
  };

  return (
    <div class="shard-select">
      <div class="shard-select-header">
        <input
          type="text"
          placeholder="Filter shards..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
        <button onClick={() => setSearchTerm("")}>Clear</button>
        <div class="row shard-category-tabs">
          {groupCategories.map((type, i) => (
            <div
              class="shard-category-tab"
              classList={{ active: groupCategory() === i }}
              onClick={() => handleSetGroupType(i)}
            >
              {type.categoryName}
            </div>
          ))}
        </div>
        <div class="row shard-group-actions">
          <button class="shard-expand-all" onClick={() => expandAll()}>
            Expand All
          </button>
          <button class="shard-collapse-all" onClick={() => collapseAll()}>
            Collapse All
          </button>
        </div>
      </div>
      <div class="shard-group-tabs" classList={{ filtered: isFiltered() }}>
        {filteredShardGroups().map((group, i) => (
          <ShardSelectGroup handleToggleGroup={() => handleToggleGroup(i)} group={group} />
        ))}
      </div>
    </div>
  );
}
