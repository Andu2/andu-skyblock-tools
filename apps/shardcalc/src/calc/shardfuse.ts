import shardDatabase from "./shards.json"
import priceData from "./shardBazaar.json"

interface RequirementConfig {
  rarity?: string | string[];
  category?: string | string[];
  shard?: string | string[];
  family?: string | string[];
}

type FuseRequirementConfigType = [RequirementConfig, RequirementConfig] | [RequirementConfig, RequirementConfig][]

interface ShardConfigType {
  name: string;
  bazaarId: string;
  attributeName: string;
  category: string;
  skill: string;
  families?: string[];
  isBasicFuseTarget?: boolean;
  sources?: string[];
  specialFuseRequirement: FuseRequirementConfigType;
}

enum Rarity {
  Common = "C",
  Uncommon = "U",
  Rare = "R",
  Epic = "E",
  Legendary = "L",
}

const rarityOrder = [
  Rarity.Common,
  Rarity.Uncommon,
  Rarity.Rare,
  Rarity.Epic,
  Rarity.Legendary,
]

const rarityValues: Record<Rarity, number> = {
  [Rarity.Common]: 0,
  [Rarity.Uncommon]: 1,
  [Rarity.Rare]: 2,
  [Rarity.Epic]: 3,
  [Rarity.Legendary]: 4,
}

enum Category {
  Water = "water",
  Combat = "combat",
  Forest = "forest",
}

enum Skill {
  Global = "global",
  Foraging = "foraging",
  Fishing = "fishing",
  Enchanting = "enchanting",
  Mining = "mining",
  Combat = "combat",
  Taming = "taming",
  Hunting = "hunting",
  Farming = "farming",
}

interface Requirement {
  rarity: string[];
  category: string[];
  shard: string[];
  family: string[];
}

type FuseRequirement = [Requirement, Requirement]
type FuseRequirementList = FuseRequirement[];

interface FuseCombination {
  id: string; // shard1 + shard2, used for quick deduping
  shard1: string; // Must be lower ID than shard2
  cost1: number;
  shard2: string; // Must be higher ID than shard1
  cost2: number;
  multiplier: number;
}

interface Shard {
  id: string;
  bazaarCost: number; 
  name: string;
  rarity: Rarity;
  number: number;
  attributeName: string;
  category: Category;
  skill: Skill;
  families: Record<string, boolean>;
  isBasicFuseTarget: boolean;
  sources: string[];
  specialFuseRequirements: FuseRequirementList;
  basicFuseTarget: string | null | undefined;
  basicFuseTargetedBy: string[];
  chameleonTargets: string[];
  chameleonTargetedBy: string[];
  allPossibleFuseCombinations: Record<string, FuseCombination>; 
}

interface ProcessShardIdReturn {
  rarity: Rarity;
  number: number;
}
function processShardId(shardId: string): ProcessShardIdReturn {
  if (!shardId || shardId.length < 2 || shardId.length > 3) {
    throw new Error(`Invalid shard ID ${shardId}`);
  }

  if (!Object.values(Rarity).includes(shardId[0] as Rarity)) {
    throw new Error(`Invalid shard ID rarity ${shardId}`);
  }
  const rarity = shardId[0] as Rarity;

  const number = parseInt(shardId.slice(1), 10);
  if (isNaN(number)) {
    throw new Error(`Invalid shard ID number ${shardId}`);
  }
  
  return { rarity: rarity, number };
}

function processCategory(category: string): Category {
  if (!Object.values(Category).includes(category as Category)) {
    throw new Error(`Invalid category ${category}`);
  }
  return category as Category;
}

function processSkill(skill: string): Skill {
  if (!Object.values(Skill).includes(skill as Skill)) {
    throw new Error(`Invalid skill ${skill}`);
  }
  return skill as Skill;
}

function newBlankFamilyMap(): Record<string, boolean> {
  const familyMap: Record<string, boolean> = {};
  for (const family of shardDatabase.families) {
    familyMap[family] = false;
  }
  return familyMap;
}

function processFamilies(families: string[]): Record<string, boolean> {
  const familyMap = newBlankFamilyMap();
  families.forEach(family => {
    if (familyMap[family] === undefined) {
      throw new Error(`Invalid family ${family}`);
    }
    familyMap[family] = true;
  });
  return familyMap;
}

function processRequirement(config: RequirementConfig): Requirement {
  const requirement: Requirement = {
    rarity: [],
    category: [],
    shard: [],
    family: [],
  };

  if (config.rarity !== undefined) {
    if (Array.isArray(config.rarity)) {
      requirement.rarity = config.rarity;
    } else {
      requirement.rarity = [config.rarity];
    }
  }

  if (config.category !== undefined) {
    if (Array.isArray(config.category)) {
      requirement.category = config.category;
    } else {
      requirement.category = [config.category];
    }
  }

  if (config.shard !== undefined) {
    if (Array.isArray(config.shard)) {
      requirement.shard = config.shard;
    } else {
      requirement.shard = [config.shard];
    }
  }

  if (config.family !== undefined) {
    if (Array.isArray(config.family)) {
      requirement.family = config.family;
    } else {
      requirement.family = [config.family];
    }
  }

  if (requirement.rarity.length + requirement.category.length + requirement.shard.length + requirement.family.length === 0) {
    throw new Error("At least one requirement must be specified");
  }

  return requirement;
}

function processSpecialFuseRequirements(requirementConfig: FuseRequirementConfigType): FuseRequirementList {
  const requirements: FuseRequirementList = [];

  if (requirementConfig === undefined || requirementConfig === null) {
    return requirements; // No special fuse requirements
  }
  if (!Array.isArray(requirementConfig)) {
    throw new Error(`Invalid special fuse requirement format ${JSON.stringify(requirementConfig)}`);
  }

  if (requirementConfig.length === 0) {
    return requirements; // No requirements to process
  }
  else if (!Array.isArray(requirementConfig[0])) {
    // Single set of requirements (most common case)
    if (requirementConfig.length !== 2) {
      throw new Error("Invalid fuse requirement format");
    }
    const req1 = processRequirement(requirementConfig[0] as RequirementConfig);
    const req2 = processRequirement(requirementConfig[1] as RequirementConfig);
    requirements.push([req1, req2]);
  }
  else {
    // Multiple sets of possible requirements
    for (const reqPair of requirementConfig as [RequirementConfig, RequirementConfig][]) {
      if (reqPair.length !== 2) {
        throw new Error("Invalid fuse requirement format");
      }
      const req1 = processRequirement(reqPair[0]);
      const req2 = processRequirement(reqPair[1]);
      requirements.push([req1, req2]);
    }
  }

  return requirements;
}

function processShardConfig(id: string, shardConfig: ShardConfigType): Shard {
  const { rarity, number } = processShardId(id);
  const category = processCategory(shardConfig.category);
  const skill = processSkill(shardConfig.skill);
  const families = processFamilies(shardConfig.families || []);
  const specialFuseRequirements = processSpecialFuseRequirements(shardConfig.specialFuseRequirement);
  const bazaarCost = priceData.shardPrices[shardConfig.bazaarId as keyof typeof priceData.shardPrices] || 1;

  return {
    id: id,
    name: shardConfig.name,
    bazaarCost: bazaarCost,
    rarity: rarity,
    number: number,
    attributeName: shardConfig.attributeName,
    category: category,
    skill: skill,
    families: families,
    isBasicFuseTarget: !!shardConfig.isBasicFuseTarget,
    sources: shardConfig.sources || [],
    specialFuseRequirements: specialFuseRequirements,

    // the following are calculated after all shards are processed
    basicFuseTarget: undefined,
    basicFuseTargetedBy: [],
    chameleonTargets: [],
    chameleonTargetedBy: [],
    allPossibleFuseCombinations: {},
  }
}

function addBasicFuses(sortedRarityGroups: Record<Rarity, Shard[]>): void {
  for (const raritySet of Object.values(sortedRarityGroups)) {
    for (let i = 0; i < raritySet.length; i++) {
      const shard = raritySet[i];
      for (let j = i + 1; j < raritySet.length; j++) {
        const otherShard = raritySet[j];
        if (otherShard.isBasicFuseTarget && otherShard.category === shard.category) {
          shard.basicFuseTarget = otherShard.id;
          otherShard.basicFuseTargetedBy.push(shard.id);
          break;
        }
      }
      if (shard.basicFuseTarget === undefined) {
        // undefined means we don't know the value; null means we know it has no value
        shard.basicFuseTarget = null;
      }
    }
  }
}

function addChameleonFuses(shards: Record<string, Shard>, numberedRarityGroups: Record<Rarity, Record<number, Shard>>): void {
  for (const shard of Object.values(shards)) {
    const possibleTargets = [
      {
        rarity: shard.rarity,
        number: shard.number + 1
      },
      {
        rarity: shard.rarity,
        number: shard.number + 2
      },
      {
        rarity: shard.rarity,
        number: shard.number + 3
      }
    ];
    if (shard.rarity !== Rarity.Legendary) {
      const nextRarity = rarityOrder[rarityValues[shard.rarity] + 1];
      possibleTargets.push({
        rarity: nextRarity,
        number: 1
      });
      possibleTargets.push({
        rarity: nextRarity,
        number: 2
      });
      possibleTargets.push({
        rarity: nextRarity,
        number: 3
      });
    }

    for (const target of possibleTargets) {
      const targetShard = numberedRarityGroups[target.rarity][target.number];
      if (targetShard !== undefined) {
        shard.chameleonTargets.push(targetShard.id);
        targetShard.chameleonTargetedBy.push(shard.id);
      }
    }
  }
}

function getFuseCombination(shard1: string, shard2: string, shards: Record<string, Shard>, isSpecial: boolean = false): FuseCombination {
  const shardObj1 = shards[shard1];
  const shardObj2 = shards[shard2];

  if (!shardObj1) {
    throw new Error(`Invalid shard ID for combination: ${shard1}`);
  }
  if (!shardObj2) {
    throw new Error(`Invalid shard ID for combination: ${shard2}`);
  }

  let cost1 = shardDatabase.familyFuseCost.default;
  for (const costAdjustedFamily in shardDatabase.familyFuseCost) {
    if (shardObj1.families[costAdjustedFamily]) {
      cost1 = shardDatabase.familyFuseCost[costAdjustedFamily as keyof typeof shardDatabase.familyFuseCost];
      break;
    }
  }

  let cost2 = shardDatabase.familyFuseCost.default;
  for (const costAdjustedFamily in shardDatabase.familyFuseCost) {
    if (shardObj2.families[costAdjustedFamily]) {
      cost2 = shardDatabase.familyFuseCost[costAdjustedFamily as keyof typeof shardDatabase.familyFuseCost];
      break;
    }
  }

  const order = [shardObj1, shardObj2];
  order.sort((a, b) => {
    const sortValA = rarityValues[a.rarity] * 1000 + a.number;
    const sortValB = rarityValues[b.rarity] * 1000 + b.number;
    return sortValA - sortValB;
  });
  const id = `${order[0].id}${order[1].id}`;

  let multiplier = 1;
  if (isSpecial) {
    multiplier = shardDatabase.specialFuseMultiplier;
  }

  return {
    id: id,
    shard1: shard1,
    cost1: cost1,
    shard2: shard2,
    cost2: cost2,
    multiplier: multiplier,
  };
}

const CHAMELEON_ID = "L4";

const reqRarityValues: Record<string, number> = {
  "common": 0,
  "uncommon": 1,
  "rare": 2,
  "epic": 3,
  "legendary": 4,
}

function meetsRequirement(requirement: Requirement, shard: Shard): boolean {
  if (requirement.rarity.length > 0) {
    let meetsRarity = false;

    for (const rarityReq of requirement.rarity) {
      let baseRarity = rarityReq;
      let mode = "eq";
      if (rarityReq.slice(-1) === "+") {
        baseRarity = rarityReq.slice(0, -1);
        mode = "ge";
      }

      const reqRarityValue = reqRarityValues[baseRarity];
      if (reqRarityValue === undefined) {
        throw new Error(`Invalid rarity requirement ${rarityReq}`);
      }
      const shardRarityValue = rarityValues[shard.rarity];
      if (mode === "eq" && shardRarityValue === reqRarityValue) {
        meetsRarity = true;
        break;
      }
      if (mode === "ge" && shardRarityValue >= reqRarityValue) {
        meetsRarity = true;
        break;
      }
    }

    if (!meetsRarity) {
      return false;
    }
  }

  if (requirement.category.length > 0) {
    let meetsCategory = false;
    for (const categoryReq of requirement.category) {
      if (shard.category === categoryReq) {
        meetsCategory = true;
        break;
      }
    }
    if (!meetsCategory) {
      return false;
    }
  }

  if (requirement.shard.length > 0) {
    let meetsShard = false;
    for (const shardReq of requirement.shard) {
      if (shard.id === shardReq) {
        meetsShard = true;
        break;
      }
    }
    if (!meetsShard) {
      return false;
    }
  }

  if (requirement.family.length > 0) {
    let meetsFamily = false;
    for (const familyReq of requirement.family) {
      if (shard.families[familyReq]) {
        meetsFamily = true;
        break;
      }
    }
    if (!meetsFamily) {
      return false;
    }
  }
  
  return true;
}

function calculateAllFuseCombinations(shards: Record<string, Shard>): void {
  for (const shard of Object.values(shards)) {
    const combinations: Record<string, FuseCombination> = {};

    // Basic fuse combinations
    shard.basicFuseTargetedBy.forEach(function(fuserId) {
      // .. literally any combination? Need to test
      for (const fuser2 in shards) {
        const newCombination = getFuseCombination(fuserId, fuser2, shards);
        combinations[newCombination.id] = newCombination;
      }
    });

    // Chameleon fuse combinations
    shard.chameleonTargetedBy.forEach(function(fuserId) {
      const newCombination = getFuseCombination(fuserId, CHAMELEON_ID, shards);
      combinations[newCombination.id] = newCombination;
    });
    
    // Special fuse combinations
    shard.specialFuseRequirements.forEach(function(requirementPair) {
      const [req1, req2] = requirementPair;
      const validShards1 = Object.values(shards).filter(s => meetsRequirement(req1, s));
      const validShards2 = Object.values(shards).filter(s => meetsRequirement(req2, s));
      for (const shard1 of validShards1) {
        for (const shard2 of validShards2) {
          const newCombination = getFuseCombination(shard1.id, shard2.id, shards, true);
          combinations[newCombination.id] = newCombination;
        }
      }
    });

    shard.allPossibleFuseCombinations = combinations;
  }
}

export type ShardView = Partial<Shard>

export interface FuseCombinationView extends FuseCombination {
  costPerShard: number;
  shard1Name: string;
  shard2Name: string;
}
function getFuseCosts(shard: Shard, shards: Record<string, Shard>): FuseCombinationView[] {
  const sortedCombinations: FuseCombinationView[] = [];
  for (const combination of Object.values(shard.allPossibleFuseCombinations)) {
    const bazaarCost1 = shards[combination.shard1].bazaarCost * combination.cost1;
    const bazaarCost2 = shards[combination.shard2].bazaarCost * combination.cost2;
    const costPerShard = (bazaarCost1 + bazaarCost2) / combination.multiplier;
    sortedCombinations.push({
      ...combination,
      costPerShard: costPerShard,
      shard1Name: shards[combination.shard1].name,
      shard2Name: shards[combination.shard2].name,
    });
  }

  sortedCombinations.sort((a, b) => a.costPerShard - b.costPerShard);
  return sortedCombinations;
}

interface ShardFuseCalc {
  getShardIds: () => string[];
  getShard: (shardId: string) => Shard;
  getFuseView: (shardId: string) => FuseCombinationView[];
}
export function initShardFuseCalc(): ShardFuseCalc {
  const shards: Record<string, Shard> = {};

  const sortedRarityGroups: Record<Rarity, Shard[]> = {
    [Rarity.Common]: [],
    [Rarity.Uncommon]: [],
    [Rarity.Rare]: [],
    [Rarity.Epic]: [],
    [Rarity.Legendary]: [],
  }

  const numberedRarityGroups: Record<Rarity, Record<number, Shard>> = {
    [Rarity.Common]: [],
    [Rarity.Uncommon]: [],
    [Rarity.Rare]: [],
    [Rarity.Epic]: [],
    [Rarity.Legendary]: [],
  }

  for (const shardId in shardDatabase.shards) {
    // If TypeScript were any good, these type assertions wouldn't be necessary
    const shard = processShardConfig(shardId, shardDatabase.shards[shardId as keyof typeof shardDatabase.shards] as ShardConfigType);
    shards[shardId] = shard;
    sortedRarityGroups[shard.rarity].push(shard);
    numberedRarityGroups[shard.rarity][shard.number] = shard;
  }

  for (const rarity in sortedRarityGroups) {
    sortedRarityGroups[rarity as Rarity].sort((a, b) => a.number - b.number);
  }

  // Basic fuse target: next incremental ID of same rarity in same category that is a possible basic fuse target (mostly huntables)
  addBasicFuses(sortedRarityGroups);
  
  // Chameleon target: next three incremental IDs of same rarity, or next rarity up (starting at 1) if missing
  addChameleonFuses(shards, numberedRarityGroups);

  calculateAllFuseCombinations(shards);

  return {
    getShardIds: () => Object.keys(shards),
    getShard: (shardId: string): Shard => {
      const shard = shards[shardId];
      if (!shard) {
        throw new Error(`Invalid shard ID ${shardId}`);
      }
      return shard;
    },
    getFuseView: (shardId: string): FuseCombinationView[] => {
      const shard = shards[shardId];
      if (!shard) {
        throw new Error(`Invalid shard ID ${shardId}`);
      }
      return getFuseCosts(shard, shards);
    }
  };
}