import type { ShardView } from "./view";
import { formatNumber, formatEffect, formatSource } from "./format";
import "./ShardDetails.css";
import type { HistoryControls } from "./history";

export function ShardDetails(props: { shard: ShardView; history: HistoryControls }) {
  const rarityClass = props.shard.rarity;

  return (
    <div class="shard-details">
      <div class="row">
        <div class="column">
          <img class="shard-image" src="/shard_placeholder.png" />
        </div>
        <div class="column">
          <span class={["shard-name", rarityClass].join(" ")}>
            {props.shard.id} {props.shard.name}
          </span>{" "}
          ({props.shard.attributeName})
        </div>
        <div class="column">Buy price: {formatNumber(props.shard.bazaarPrice)}</div>
      </div>
      <div class="row">
        <div class="column">
          <span class="shard-effect-description">
            {formatEffect(props.shard.effectDescription, props.shard.effectMax, props.shard.effect2Max)}
          </span>
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span class="shard-rarity">Rarity: {props.shard.rarity}</span>
        </div>
        <div class="column">
          <span class="shard-category">Category: {props.shard.category}</span>
        </div>
        <div class="column">
          <span class="shard-skill">Skill: {props.shard.skill}</span>
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span>Basic fuse target: {props.shard.basicFuseTarget || "NONE"}</span>
        </div>
        <div class="column">
          <span>Chameleon targets: {props.shard.chameleonTargets.join(", ")}</span>
        </div>
      </div>
      <div class="row">
        <div class="column">
          Sources: {props.shard.sources ? props.shard.sources.map(formatSource).join(", ") : "NONE"}
        </div>
      </div>
      <div class="row">
        <div class="column">Basic fuse target: {props.shard.isBasicFuseTarget ? "YES" : "NO"}</div>
      </div>
      <div class="row">
        <div class="column">
          Special fuses:{" "}
          {props.shard.specialFusesDesc
            ? props.shard.specialFusesDesc.map((pair) => pair.join(" + ")).join(", ")
            : "NONE"}
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span class="shard-fuse-combinations">Fuse combinations:</span>
          <table>
            <thead>
              <tr>
                <th>Shard 1</th>
                <th>Shard 1 to Max</th>
                <th>Shard 2</th>
                <th>Shard 2 to Max</th>
                <th>Price Per Shard</th>
                <th>Efficiency</th>
                <th>Profit Per Fuse</th>
                <th>Swappable</th>
                <th>Fuse Type</th>
                <th>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {props.shard.valuatedFuses.map(function (fuse) {
                const efficiency = props.shard.bazaarPrice / fuse.bazaarPricePerShard;
                const profit = (props.shard.bazaarPrice - fuse.bazaarPricePerShard) * fuse.multiplier;
                const shard1CostToMax = (props.shard.costToMax * fuse.shard1Cost) / fuse.multiplier;
                const shard2CostToMax = (props.shard.costToMax * fuse.shard2Cost) / fuse.multiplier;
                return (
                  <tr>
                    <td onClick={() => props.history.selectNewShard(fuse.shard1)}>
                      {fuse.shard1} {fuse.shard1Name}
                    </td>
                    <td>{shard1CostToMax}</td>
                    <td onClick={() => props.history.selectNewShard(fuse.shard2)}>
                      {fuse.shard2} {fuse.shard2Name}
                    </td>
                    <td>{shard2CostToMax}</td>
                    <td>{formatNumber(fuse.bazaarPricePerShard)}</td>
                    <td>{efficiency.toFixed(3)}</td>
                    <td>{profit > 0 ? formatNumber(profit) : ""}</td>
                    <td>{fuse.swappable ? "Yes" : "No"}</td>
                    <td>{fuse.fuseType}</td>
                    <td>{fuse.multiplier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
