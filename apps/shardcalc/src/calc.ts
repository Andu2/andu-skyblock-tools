import { loadData } from "./data";
import type { ShardDatabase, RequirementInfo } from "./data";

export interface ValuatedFuseResult {
  shard1: string;
  shard1Cost: number;
  shard1Name: string;
  shard2: string;
  shard2Cost: number;
  shard2Name: string;
  bazaarPricePerShard: number;
  dupeId: string; // Duplicates are allowed, but if they lead to the same results, we use this to de-dupe
  fuseType: string;
  swappable: boolean;
  multiplier: number;
}

function removeFuseDuplicates(options: ValuatedFuseResult[]) {
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
      options[i - 1].swappable = true;
      i--; // Adjust index after removal
    } else {
      lastDupeId = options[i].dupeId;
      if (options[i].shard1 === options[i].shard2) {
        // Fuses with self are inherently swappable even though there is only one occurrence
        options[i].swappable = true;
      }
    }
  }
}

function sortFusesByValue(options: ValuatedFuseResult[]) {
  options.sort((a, b) => a.bazaarPricePerShard - b.bazaarPricePerShard);
}

function calculateValuatedFusesByTarget(db: ShardDatabase): Record<string, ValuatedFuseResult[]> {
  const fuseOptions: Record<string, ValuatedFuseResult[]> = {};
  for (const id in db.shards) {
    fuseOptions[id] = [];
  }

  for (const id1 in db.shards) {
    const s1 = db.shards[id1];
    for (const id2 in s1.fuseCombinations) {
      const combo = s1.fuseCombinations[id2];
      for (const result of combo.results) {
        if (result.id === id1 || result.id === id2) {
          continue;
        }
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

        fuseOptions[result.id].push({
          shard1: id1,
          shard1Cost: combo.cost1,
          shard1Name: s1.name,
          shard2: id2,
          shard2Cost: combo.cost2,
          shard2Name: s2.name,
          bazaarPricePerShard: (bazaarPrice1 * combo.cost1 + bazaarPrice2 * combo.cost2) / result.multiplier,
          dupeId: dupeId,
          swappable: false, // Will be calculated later
          fuseType: result.type,
          multiplier: result.multiplier,
        });
      }
    }
  }

  for (const options of Object.values(fuseOptions)) {
    removeFuseDuplicates(options);
    sortFusesByValue(options);
  }
  return fuseOptions;
}

// interface ShardCost {
//   shardId: string;
//   shardName: string;
//   cost: number;
// }

// interface ValuatedRequirementInfo extends RequirementInfo {
//   matchCosts: ShardCost[];
// }

// function getValuatedRequirementInfo(db: ShardDatabase): ValuatedRequirementInfo[] {
//   const requirementInfo: ValuatedRequirementInfo[] = db.requirementInfo.map(info => {
//     const matchCosts: ShardCost[] = info.matches.map(match => {
//       const shard = db.shards[match];
//       if (!shard) {
//         throw new Error(`Invalid shard match ${match} in requirement info`);
//       }
//       const bazaarPrice = db.prices[shard.bazaarId];
//       if (bazaarPrice === undefined) {
//         throw new Error(`Missing bazaar price for shard ${shard.id} (bazaar ID ${shard.bazaarId})`);
//       }
//       return {
//         shardId: match,
//         shardName: shard.name,
//         cost: bazaarPrice
//       }
//     });

//     matchCosts.sort((a, b) => a.cost - b.cost);

//     return {
//       ...info,
//       matchCosts: matchCosts
//     };
//   });

//   return requirementInfo;
// }

export interface ShardCalc {
  db: ShardDatabase;
  valuatedFusesByTarget: Record<string, ValuatedFuseResult[]>;
}

export function getShardCalc(): ShardCalc {
  const db = loadData();
  const valuatedFusesByTarget = calculateValuatedFusesByTarget(db);

  return {
    db: db,
    valuatedFusesByTarget: valuatedFusesByTarget,
  };
}
