import type { ShardView } from "./view";
import { A } from "@solidjs/router";
import { formatNumber } from "./format";
import { getCoinStack, shardSmallImgPath } from "./assetPaths";

export function ShardOption(props: { shard: ShardView }) {
  const rarityClass = props.shard.rarity;
  return (
    <A href={`/${props.shard.id}`} activeClass="active-shard-option">
      <div class="shard-option row">
        <div class="column">
          <div class="row">
            <div class="column">
              <img class="shard-image" src={shardSmallImgPath(props.shard.id)} />
            </div>
            <div class="column">
              <div class={["shard-name", rarityClass].join(" ")}>
                {props.shard.id} {props.shard.name}
              </div>
              <div class="shard-attribute">{props.shard.attributeName}</div>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="row">
            <div class="column">
              <span class="shard-price">{formatNumber(props.shard.bazaarPrice)}</span>
            </div>
            <div class="column coin-stack-wrap">
              <img class="coin-stack" src={getCoinStack(props.shard.bazaarPrice)} />
            </div>
          </div>
        </div>
      </div>
    </A>
  );
}
