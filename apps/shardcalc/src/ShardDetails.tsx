import type { ShardView } from "./view";
import { A } from "@solidjs/router";
import { formatNumber, formatEffect, formatSource, getFusionTypeIcon, capitalize } from "./format";
import { getCoinStack, shardImgPath } from "./assetPaths";
import { useContext } from "solid-js";
import { AppContext } from "./appContext";

export function ShardDetails(props: { shard: ShardView }) {
  const rarityClass = () => props.shard.rarity;
  const { vm } = useContext(AppContext);

  return (
    <div class="shard-details">
      <div class="row shard-detail-header">
        <div class="column shard-detail-image">
          <img class="shard-image-big" src={shardImgPath(props.shard.id)} />
        </div>
        <div class="column shard-detail-summary">
          <div class="row shard-detail-line">
            <span class={["shard-detail-name", rarityClass()].join(" ")}>
              {props.shard.id} {props.shard.name}
            </span>
            <span class="shard-rarity">{capitalize(`${props.shard.rarity} ${props.shard.category} shard`)}</span>
          </div>
          <div class="row shard-detail-line">
            <span class="shard-detail-attribute">{props.shard.attributeName}</span>
            <span class="shard-effect-description">
              {formatEffect(props.shard.effectDescription, props.shard.effectMax, props.shard.effect2Max)}
            </span>
          </div>
          <span class="shard-skill">Shards required to max: {props.shard.costToMax}</span>
          <div class="row">
            <div class="coin-stack-wrap">
              <img class="coin-stack" src={getCoinStack(props.shard.bazaarPrice)} />
            </div>
            <div class="shard-price">
              <span class="shard-price-number">{formatNumber(props.shard.bazaarPrice)}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span>Basic fuse target: {props.shard.basicFuseTarget || "NONE"}</span>
        </div>
        <div class="column">
          <span>Chameleon targets: {props.shard.chameleonTargets && props.shard.chameleonTargets.join(", ")}</span>
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
          <span>Fuse combinations:</span>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Shard 1</th>
                <th>Shard 1 to Max</th>
                <th>Shard 2</th>
                <th>Shard 2 to Max</th>
                <th>Price Per Shard</th>
                <th>Efficiency</th>
                <th>Profit Per Fuse</th>
                <th></th>
                <th></th>
                <th>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {props.shard.valuatedFuses.map(function (fuse, i) {
                const efficiency = props.shard.bazaarPrice / fuse.bazaarPricePerShard;
                const profit = (props.shard.bazaarPrice - fuse.bazaarPricePerShard) * fuse.multiplier;
                const shard1CostToMax = (props.shard.costToMax * fuse.shard1Cost) / fuse.multiplier;
                const shard2CostToMax = (props.shard.costToMax * fuse.shard2Cost) / fuse.multiplier;
                return (
                  <tr>
                    <td>{i + 1}</td>
                    <A class="text-link" href={`/${fuse.shard1}`}>
                      <td>
                        {fuse.shard1} {fuse.shard1Name}
                      </td>
                    </A>
                    <td>{shard1CostToMax}</td>
                    <A class="text-link" href={`/${fuse.shard2}`}>
                      <td>
                        {fuse.shard2} {fuse.shard2Name}
                      </td>
                    </A>
                    <td>{shard2CostToMax}</td>
                    <td>{formatNumber(fuse.bazaarPricePerShard)}</td>
                    <td>{efficiency.toFixed(3)}</td>
                    <td>{profit > 0 ? formatNumber(profit) : ""}</td>
                    <td>{fuse.swappable ? "🔄" : ""}</td>
                    <td>{getFusionTypeIcon(fuse.fuseType)}</td>
                    <td>{fuse.multiplier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span>Marginal contributions:</span>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Shard</th>
                <th>Marginal Contribution</th>
              </tr>
            </thead>
            <tbody>
              {props.shard.marginalContributionsToThis.map(function (contribution, i) {
                return (
                  <tr>
                    <td>{i + 1}</td>
                    <td>
                      <A href={`/${contribution.shardId}`}>
                        {contribution.shardId} {vm.getShard(contribution.shardId).name}
                      </A>
                    </td>
                    <td>{contribution.isRequired ? "REQUIRED" : formatNumber(contribution.contributionScore)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div class="row">
        <div class="column">
          <span>Most useful for:</span>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Shard</th>
                <th>Marginal Contribution</th>
              </tr>
            </thead>
            <tbody>
              {props.shard.marginalContributionsToOthers.map(function (contribution, i) {
                return (
                  <tr>
                    <td>{i + 1}</td>
                    <td>
                      <A href={`/${contribution.targetId}`}>
                        {contribution.targetId} {vm.getShard(contribution.targetId).name}
                      </A>
                    </td>
                    <td>{contribution.isRequired ? "REQUIRED" : formatNumber(contribution.contributionScore)}</td>
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
