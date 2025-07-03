import type { ShardView } from "./view";
import "./ShardOption.css";
import { formatNumber } from "./format";

export function ShardOption(props: { shard: ShardView; isSelected: boolean; onSelect: () => void }) {
  const rarityClass = props.shard.rarity;
  const optionClasses = ["shard-option", "row"];
  if (props.isSelected) {
    optionClasses.push("selected");
  }
  return (
    <div class={optionClasses.join(" ")} onClick={() => props.onSelect()}>
      <div class="column">
        <img class="shard-image" src="img/shard_placeholder.png" />
      </div>
      <div class="column">
        <span class={["shard-name", rarityClass].join(" ")}>
          {props.shard.id} {props.shard.name}
        </span>{" "}
        ({props.shard.attributeName})
      </div>
      <div class="column">Buy price: {formatNumber(props.shard.bazaarPrice)}</div>
    </div>
  );
}
