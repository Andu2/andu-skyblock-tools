import { getShardCalc } from "./calc";
import type { ShardCalc, ValuatedFuseResult } from "./calc";
import type { Source } from "./data";

function getBazaarPrice(id: string, calc: ShardCalc): number {
  const shard = calc.db.shards[id];
  if (!shard) {
    throw new Error(`Shard with ID ${id} not found in database`);
  }
  const bazaarPrice = calc.db.prices[shard.bazaarId];
  if (bazaarPrice === undefined) {
    throw new Error(`Missing bazaar price for shard ${shard.id} (bazaar ID ${shard.bazaarId})`);
  }
  return bazaarPrice;
}

export interface ShardView {
  id: string;
  bazaarPrice: number;
  name: string;
  rarity: string;
  number: number;
  attributeName: string;
  effectDescription: string;
  effectMax: number;
  effect2Max?: number;
  effectTags?: Record<string, boolean>;
  category: string;
  skill: string;
  families?: Record<string, boolean>;
  isBasicFuseTarget: boolean;
  sources?: Source[];
  specialFusesDesc?: string[][];
  basicFuseTarget: string;
  chameleonTargets: string[];
  valuatedFuses: ValuatedFuseResult[];
  costToMax: number;
}

function getShardView(id: string, calc: ShardCalc): ShardView {
  const shard = calc.db.shards[id];
  if (!shard) {
    throw new Error(`Shard with ID ${id} not found in database`);
  }
  return {
    id: id,
    bazaarPrice: getBazaarPrice(id, calc),
    name: shard.name,
    rarity: shard.rarity,
    number: shard.number,
    attributeName: shard.attributeName,
    effectDescription: shard.effectDescription,
    effectMax: shard.effectMax,
    effect2Max: shard.effect2Max,
    effectTags: shard.effectTags,
    category: shard.category,
    skill: shard.skill,
    families: shard.families,
    isBasicFuseTarget: shard.isBasicFuseTarget,
    sources: shard.sources,
    specialFusesDesc: shard.specialFusesDesc,
    basicFuseTarget: shard.basicFuseTarget,
    chameleonTargets: shard.chameleonTargets,
    valuatedFuses: calc.valuatedFusesByTarget[id] || [],
    costToMax: calc.db.costToMax[shard.rarity] || 0,
  };
}

export interface ShardGroup {
  groupName: string;
  shardIds: string[];
}

function compareShardGroup(a: ShardGroup, b: ShardGroup): number {
  if (a.groupName < b.groupName) return -1;
  if (a.groupName > b.groupName) return 1;
  return 0;
}

function rarityValue(rarity: string): number {
  switch (rarity) {
    case "common":
      return 1;
    case "uncommon":
      return 2;
    case "rare":
      return 3;
    case "epic":
      return 4;
    case "legendary":
      return 5;
    default:
      return 0;
  }
}

export interface ShardViewModel {
  shardIds: string[];
  familyGroups: ShardGroup[];
  categoryGroups: ShardGroup[];
  skillGroups: ShardGroup[];
  tagGroups: ShardGroup[];
  sourceTypeGroups: ShardGroup[];
  rarityGroups: ShardGroup[];
  requirementIds: string[];
  getShard: (shardId: string) => ShardView;
}
export function getShardViewModel(): ShardViewModel {
  const calc = getShardCalc();

  const shardIds: string[] = [
    ...calc.db.rarityGroups["common"],
    ...calc.db.rarityGroups["uncommon"],
    ...calc.db.rarityGroups["rare"],
    ...calc.db.rarityGroups["epic"],
    ...calc.db.rarityGroups["legendary"],
  ];

  const familyGroups: ShardGroup[] = Object.entries(calc.db.familyGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(compareShardGroup);

  const categoryGroups: ShardGroup[] = Object.entries(calc.db.categoryGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(compareShardGroup);

  const skillGroups: ShardGroup[] = Object.entries(calc.db.skillGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(compareShardGroup);

  const tagGroups: ShardGroup[] = Object.entries(calc.db.tagGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(compareShardGroup);

  const sourceTypeGroups: ShardGroup[] = Object.entries(calc.db.sourceTypeGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(function (a, b) {
      let sortVal = 0;
      if (a.groupName < b.groupName) sortVal = -1;
      if (a.groupName > b.groupName) sortVal = 1;

      // Put fusionOnly at the top
      if (a.groupName === "fusionOnly") sortVal -= 1000;
      if (b.groupName === "fusionOnly") sortVal += 1000;

      return sortVal;
    });

  const rarityGroups: ShardGroup[] = Object.entries(calc.db.rarityGroups)
    .map(([name, ids]) => ({
      groupName: name,
      shardIds: ids,
    }))
    .sort(function (a, b) {
      return rarityValue(a.groupName) - rarityValue(b.groupName);
    });

  return {
    shardIds: shardIds,
    familyGroups: familyGroups,
    categoryGroups: categoryGroups,
    skillGroups: skillGroups,
    tagGroups: tagGroups,
    sourceTypeGroups: sourceTypeGroups,
    rarityGroups: rarityGroups,
    requirementIds: calc.db.specialRequirementList,
    getShard: (shardId: string) => getShardView(shardId, calc),
  };
}
