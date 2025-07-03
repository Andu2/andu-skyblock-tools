import shardsProcessedJson from "../../../data/shards_processed.json";
import priceDataJson from "../../../data/shard_prices.json";

interface FuseResult {
  type: string;
  id: string;
  multiplier: number;
}

interface FuseCombination {
  shard1: string;
  cost1: number;
  shard2: string;
  cost2: number;
  results: FuseResult[];
}

export interface Source {
  sourceType: string;
  sourceDesc: string;
}

export interface Shard {
  id: string;
  bazaarId: string;
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
  fuseCombinations: Record<string, FuseCombination>;
}

export interface RequirementInfo {
  targets: string[];
  matches: string[];
  description: string;
}

interface ShardsProcessed {
  familyShards: Record<string, string[]>;
  categoryShards: Record<string, string[]>;
  skillShards: Record<string, string[]>;
  tagShards: Record<string, string[]>;
  sourceTypeShards: Record<string, string[]>;
  rarityShards: Record<string, string[]>;
  costToMax: Record<string, number>;
  shards: Record<string, Shard>;
  specialRequirementList: string[];
  specialRequirementInfo: Record<string, RequirementInfo>;
}

interface PriceData {
  timestamp: number;
  shardPrices: Record<string, number>;
}

export interface ShardDatabase {
  familyGroups: Record<string, string[]>;
  categoryGroups: Record<string, string[]>;
  skillGroups: Record<string, string[]>;
  tagGroups: Record<string, string[]>;
  sourceTypeGroups: Record<string, string[]>;
  rarityGroups: Record<string, string[]>;
  costToMax: Record<string, number>;
  shards: Record<string, Shard>;
  specialRequirementList: string[];
  specialRequirementInfo: Record<string, RequirementInfo>;
  priceTimestamp: number;
  prices: Record<string, number>;
}
export function loadData(): ShardDatabase {
  const shardsProcessed = shardsProcessedJson as ShardsProcessed;
  const priceData = priceDataJson as PriceData;
  return {
    familyGroups: shardsProcessed.familyShards as Record<string, string[]>,
    categoryGroups: shardsProcessed.categoryShards as Record<string, string[]>,
    skillGroups: shardsProcessed.skillShards as Record<string, string[]>,
    tagGroups: shardsProcessed.tagShards as Record<string, string[]>,
    sourceTypeGroups: shardsProcessed.sourceTypeShards as Record<string, string[]>,
    rarityGroups: shardsProcessed.rarityShards as Record<string, string[]>,
    costToMax: shardsProcessed.costToMax as Record<string, number>,
    shards: shardsProcessed.shards as Record<string, Shard>,
    specialRequirementList: shardsProcessed.specialRequirementList as string[],
    specialRequirementInfo: shardsProcessed.specialRequirementInfo as Record<string, RequirementInfo>,
    priceTimestamp: priceData.timestamp,
    prices: priceData.shardPrices as Record<string, number>,
  };
}
