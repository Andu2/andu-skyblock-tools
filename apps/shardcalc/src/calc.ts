import shardDatabase from "../../../data/shards_processed.json"
import priceData from "../../../data/shard_prices.json"

interface SpecialFuseRequirement {
  rarity?: string[];
  category?: string[];
  shard?: string[];
  family?: string[];
}

interface SpecialFuse {
  isBoosted: boolean;
  requirement1: SpecialFuseRequirement;
  requirement2: SpecialFuseRequirement;
}

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
  results: FuseResult[]
}

export interface Shard {
  id: string;
  bazaarId: string; 
  name: string;
  rarity: string;
  number: number;
  attributeName: string;
  category: string;
  skill: string;
  families: Record<string, boolean>;
  isBasicFuseTarget: boolean;
  sources: string[];
  specialFuses: SpecialFuse[];
  basicFuseTarget: string;
  chameleonTargets: string[];
  fuseCombinations: Record<string, FuseCombination>;
}

interface ShardDatabase {
  shards: Record<string, Shard>;
  prices: Record<string, number>;
}
function loadData(): ShardDatabase {
  return {
    shards: shardDatabase as Record<string, Shard>,
    prices: priceData.shardPrices as Record<string, number>
  }
}

export interface ValuatedFuseResult {
  shard1: string;
  shard1Name: string;
  shard2: string;
  shard2Name: string;
  bazaarPricePerShard: number;
  dupeId: string; // Duplicates are allowed, but if they lead to the same results, we use this to de-dupe
  swappable: boolean;
}

function calculateFusesForTarget(target: string, db: ShardDatabase): ValuatedFuseResult[] {
  const options: ValuatedFuseResult[] = [];
  
  // Maybe this should be pre-calculated at startup
  for (const id1 in db.shards) {
    const s1 = db.shards[id1];
    for (const id2 in s1.fuseCombinations) {
      const combo = s1.fuseCombinations[id2];
      for (const result of combo.results) {
        if (result.id === target) {
          const bazaarPrice1 = db.prices[s1.bazaarId];
          if (!bazaarPrice1) {
            throw new Error(`Missing bazaar price for shard ${s1.id} (bazaar ID ${s1.bazaarId})`);
          }
          const s2 = db.shards[id2];
          const bazaarPrice2 = db.prices[s2.bazaarId];
          if (!bazaarPrice2) {
            throw new Error(`Missing bazaar price for shard ${s2.id} (bazaar ID ${s2.bazaarId})`);
          }

          const dupeId = [s1.id, s2.id].sort().join("-");

          options.push({
            shard1: id1,
            shard1Name: s1.name,
            shard2: id2,
            shard2Name: s2.name,
            bazaarPricePerShard: (bazaarPrice1 + bazaarPrice2) / result.multiplier,
            dupeId: dupeId,
            swappable: false
          });
        }
      }
    }
  }

  // First, sort by ID combo to make duplicate removal easier
  // We could check for price equivalence, but that could lead to a rare bug if two unrelated fuses have the same bazaar price
  options.sort((a, b) => {
    if (a.dupeId < b.dupeId) return -1;
    if (a.dupeId > b.dupeId) return 1;
    return 0;
  });
  let lastDupeId = "";
  for (let i = 0; i < options.length; i++) {
    if (options[i].dupeId === lastDupeId) {
      options.splice(i, 1);
      options[i-1].swappable = true; // Mark as swappable
      i--; // Adjust index after removal
    } else {
      lastDupeId = options[i].dupeId;
      if (options[i].shard1 === options[i].shard2) {
        options[i].swappable = true; // If it's a self-fuse, mark it as swappable
      }
    }
  }

  // Now, sort the way we actually want
  options.sort((a, b) => a.bazaarPricePerShard - b.bazaarPricePerShard);

  return options;
}

function rarityValue(rarity: string): number {
  switch (rarity) {
    case "common": return 1;
    case "uncommon": return 2;
    case "rare": return 3;
    case "epic": return 4;
    case "legendary": return 5;
    default: return 0; // Unknown rarity
  }
}

interface ShardFuseCalc {
  getShardIds: () => string[];
  getShard: (shardId: string) => Shard;
  getFuseOptions: (shardId: string) => ValuatedFuseResult[];
}
export function initShardFuseCalc(): ShardFuseCalc {
  const db = loadData();

  return {
    getShardIds: () => {
      return Object.values(db.shards).sort((a, b) => {
        const compareValA = rarityValue(a.rarity) * 1000 + a.number;
        const compareValB = rarityValue(b.rarity) * 1000 + b.number;
        return compareValA - compareValB;
      }).map(shard => shard.id);
    },
    getShard: (shardId: string): Shard => {
      const shard = db.shards[shardId];
      if (!shard) {
        throw new Error(`Invalid shard ID ${shardId}`);
      }
      return shard;
    },
    getFuseOptions: (shardId: string): ValuatedFuseResult[] => {
      const shard = db.shards[shardId];
      if (!shard) {
        throw new Error(`Invalid shard ID ${shardId}`);
      }
      return calculateFusesForTarget(shard.id, db);
    }
  };
}