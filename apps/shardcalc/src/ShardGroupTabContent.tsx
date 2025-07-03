import type { ShardView } from "./view";
import { ShardOption } from "./ShardOption";
import { capitalize } from "./format";
import "./ShardGroupTabContent.css";

export function ShardGroupTabContent(props: {
  groupName: string;
  shards: ShardView[];
  selectedShard: string;
  onSelect: (shardId: string) => void;
}) {
  return (
    <div class="shard-group">
      <h3>{capitalize(props.groupName)}</h3>
      {props.shards.map((shard) => (
        <ShardOption
          shard={shard}
          isSelected={props.selectedShard === shard.id}
          onSelect={() => props.onSelect(shard.id)}
        />
      ))}
    </div>
  );
}
