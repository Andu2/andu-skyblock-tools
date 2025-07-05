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

interface ShardCost {
  shardId: string;
  shardName: string;
  cost: number;
}

interface ValuatedRequirementInfo extends RequirementInfo {
  matchCosts: ShardCost[];
}

function calculateValuatedRequirementInfo(db: ShardDatabase): Record<string, ValuatedRequirementInfo> {
  const valuatedRequirementInfo: Record<string, ValuatedRequirementInfo> = {};

  for (const key in db.specialRequirementInfo) {
    const info = db.specialRequirementInfo[key];
    const matchCosts: ShardCost[] = info.matches.map((match) => {
      const shard = db.shards[match];
      if (!shard) {
        throw new Error(`Invalid shard match ${match} in requirement info`);
      }
      const bazaarPrice = db.prices[shard.bazaarId];
      if (bazaarPrice === undefined) {
        throw new Error(`Missing bazaar price for shard ${shard.id} (bazaar ID ${shard.bazaarId})`);
      }
      return {
        shardId: match,
        shardName: shard.name,
        cost: bazaarPrice,
      };
    });

    matchCosts.sort((a, b) => a.cost - b.cost);

    valuatedRequirementInfo[key] = {
      ...info,
      matchCosts: matchCosts,
    };
  }

  return valuatedRequirementInfo;
}

export interface ShardContribution {
  shardId: string;
  targetId: string;
  isRequired: boolean;
  contributionScore: number;
}

interface RunningTotal {
  sumIn: number;
  countIn: number;
  sumNotIn: number;
  countNotIn: number;
  cheapest: number;
}

// Rank shards by their contribution to cheap fuses for the target
// Marginal contribution = avg price of fuses with shard in - avg price of fuses without shard
function calculateContributions(
  valuatedFusesByTarget: Record<string, ValuatedFuseResult[]>
): Record<string, Record<string, ShardContribution>> {
  const marginalContributions: Record<string, Record<string, ShardContribution>> = {};

  for (const target in valuatedFusesByTarget) {
    const fuses = valuatedFusesByTarget[target];
    const runningTotals: Record<string, RunningTotal> = {};

    // Identify the shards
    for (const fuse of fuses) {
      for (const shardId of [fuse.shard1, fuse.shard2]) {
        if (!runningTotals[shardId]) {
          runningTotals[shardId] = {
            sumIn: 0,
            countIn: 0,
            sumNotIn: 0,
            countNotIn: 0,
            cheapest: Number.MAX_VALUE,
          };
        }
      }
    }

    // Sums
    for (const fuse of fuses) {
      for (const shardId in runningTotals) {
        const isInFuse = shardId === fuse.shard1 || shardId === fuse.shard2;
        const pricePerShard = fuse.bazaarPricePerShard;

        if (isInFuse) {
          runningTotals[shardId].sumIn += pricePerShard;
          runningTotals[shardId].countIn++;
          if (pricePerShard < runningTotals[shardId].cheapest) {
            runningTotals[shardId].cheapest = pricePerShard;
          }
        } else {
          runningTotals[shardId].sumNotIn += pricePerShard;
          runningTotals[shardId].countNotIn++;
        }
      }
    }

    // Calculate marginal contributions
    marginalContributions[target] = {};
    for (const shardId in runningTotals) {
      const totals = runningTotals[shardId];
      if (totals.countNotIn === 0) {
        marginalContributions[target][shardId] = {
          shardId: shardId,
          targetId: target,
          isRequired: true,
          contributionScore: 0,
        };
      } else {
        const priceIn = totals.sumIn / totals.countIn;
        const priceNotIn = totals.sumNotIn / totals.countNotIn;
        const avgMarginalContribution = priceIn - priceNotIn;
        const weightedMarginalContribution = avgMarginalContribution * totals.countIn;
        const opportunityScore = totals.countIn / totals.sumIn;
        marginalContributions[target][shardId] = {
          shardId: shardId,
          targetId: target,
          isRequired: false,
          contributionScore: weightedMarginalContribution,
        };
      }
    }
  }

  return marginalContributions;
}

function contributionSortFunc(a: ShardContribution, b: ShardContribution): number {
  if (a.isRequired && !b.isRequired) {
    return -1;
  }
  if (!a.isRequired && b.isRequired) {
    return 1;
  }
  if (a.isRequired && b.isRequired) {
    if (a.shardId < b.shardId) {
      return -1;
    }
    if (a.shardId > b.shardId) {
      return 1;
    }
    return 0;
  }
  return a.contributionScore - b.contributionScore;
}

function getSortedContributionsByTarget(
  marginalContributions: Record<string, Record<string, ShardContribution>>
): Record<string, ShardContribution[]> {
  const sortedContributions: Record<string, ShardContribution[]> = {};

  for (const target in marginalContributions) {
    const contributions = Object.values(marginalContributions[target]);
    contributions.sort(contributionSortFunc);
    sortedContributions[target] = contributions;
  }

  return sortedContributions;
}

function getSortedContributionsByComponent(
  marginalContributions: Record<string, Record<string, ShardContribution>>
): Record<string, ShardContribution[]> {
  const contributionsByComponent: Record<string, ShardContribution[]> = {};

  for (const target in marginalContributions) {
    for (const contribution of Object.values(marginalContributions[target])) {
      if (!contributionsByComponent[contribution.shardId]) {
        contributionsByComponent[contribution.shardId] = [];
      }
      contributionsByComponent[contribution.shardId].push(contribution);
    }
  }

  for (const shardId in contributionsByComponent) {
    contributionsByComponent[shardId].sort(contributionSortFunc);
  }

  return contributionsByComponent;
}

function getTotalPriceToMax(db: ShardDatabase) {
  let totalPrice = 0;
  for (const shard of Object.values(db.shards)) {
    const bazaarPrice = db.prices[shard.bazaarId];
    if (bazaarPrice === undefined) {
      throw new Error(`Missing bazaar price for shard ${shard.id} (bazaar ID ${shard.bazaarId})`);
    }
    totalPrice += bazaarPrice * db.costToMax[shard.rarity];
  }
  return totalPrice;
}

export interface ShardCalc {
  db: ShardDatabase;
  valuatedFusesByTarget: Record<string, ValuatedFuseResult[]>;
  valuatedRequirementInfo: Record<string, ValuatedRequirementInfo>;
  sortedContributionsByTarget: Record<string, ShardContribution[]>;
  sortedContributionsByComponent: Record<string, ShardContribution[]>;
  totalPriceToMax: number;
}

export function getShardCalc(): ShardCalc {
  const db = loadData();
  const valuatedFusesByTarget = calculateValuatedFusesByTarget(db);
  const valuatedRequirementInfo = calculateValuatedRequirementInfo(db);
  const marginalContributions = calculateContributions(valuatedFusesByTarget);
  const sortedContributionsByTarget = getSortedContributionsByTarget(marginalContributions);
  const sortedContributionsByComponent = getSortedContributionsByComponent(marginalContributions);
  const totalPriceToMax = getTotalPriceToMax(db);

  return {
    db: db,
    valuatedFusesByTarget: valuatedFusesByTarget,
    valuatedRequirementInfo: valuatedRequirementInfo,
    sortedContributionsByTarget: sortedContributionsByTarget,
    sortedContributionsByComponent: sortedContributionsByComponent,
    totalPriceToMax: totalPriceToMax,
  };
}
