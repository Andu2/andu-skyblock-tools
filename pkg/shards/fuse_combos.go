package shards

import (
	"slices"
)

type specialFuseOption struct {
	target string
	option *specialFuse
}

func getAllSpecialFuseOptions(shards map[string]*shard) []*specialFuseOption {
	fuseOptions := make([]*specialFuseOption, 0, 100)
	for _, s := range shards {
		if len(s.SpecialFuses) == 0 {
			continue
		}
		for _, sf := range s.SpecialFuses {
			option := specialFuseOption{
				target: s.ID,
				option: &sf,
			}
			fuseOptions = append(fuseOptions, &option)
		}
	}

	slices.SortFunc(fuseOptions, func(a, b *specialFuseOption) int {
		return getFusePriority(b, shards) - getFusePriority(a, shards)
	})

	return fuseOptions
}

func getFusePriority(opt *specialFuseOption, shards map[string]*shard) int {
	shard := shards[opt.target]
	sortNum := shard.Number + rarityValue(shard.Rarity)*1000

	// Prioritize uncommon+ over common+ somehow
	// I suspect they may have a series of if statements,
	// in which case there's no reliable way we can determine priority with logic
	for _, req := range []specialFuseRequirement{opt.option.Requirement1, opt.option.Requirement2} {
		if len(req.Category) == 0 && len(req.Shard) == 0 && len(req.Family) == 0 {
			for _, r := range req.Rarity {
				if r[len(r)-1:] == "+" {
					baseRarity := rarity(r[:len(r)-1])
					value := rarityValue(baseRarity)
					sortNum += (value - 5) * 10000
				}
			}
		}
	}

	return sortNum
}

func addFuseCombos(shards map[string]*shard, cfg *shardConfig) {
	sortedShards := getSortedShards(shards)
	allSpecialFuses := getAllSpecialFuseOptions(shards)
	// We need to loop over the full list twice because order does matter, and fusion with self is possible
	for _, s1 := range sortedShards {
		for _, s2 := range sortedShards {
			results := make([]fuseResult, 0, 10)

			// Priority 1: chameleon
			if s1.ID == chameleonId {
				for _, target := range s2.ChameleonTargets {
					results = append(results, fuseResult{
						Type:       "chameleon",
						ID:         target,
						Multiplier: 1,
					})
				}
			} else if s2.ID == chameleonId {
				for _, target := range s1.ChameleonTargets {
					results = append(results, fuseResult{
						Type:       "chameleon",
						ID:         target,
						Multiplier: 1,
					})
				}
			}

			// Priority 2: basic fuses
			useS1 := s1.BasicFuseTarget != ""
			useS2 := s2.BasicFuseTarget != ""

			if s1.Category == s2.Category {
				s1Rarity := rarityValue(s1.Rarity)
				s2Rarity := rarityValue(s2.Rarity)
				if s1Rarity > s2Rarity {
					useS2 = false
				} else {
					// If they are equal, it uses the 2nd one, which causes order to matter
					useS1 = false
				}
			}

			if useS1 {
				results = append(results, fuseResult{
					Type:       "basic",
					ID:         s1.BasicFuseTarget,
					Multiplier: 1,
				})
			}
			if useS2 {
				results = append(results, fuseResult{
					Type:       "basic",
					ID:         s2.BasicFuseTarget,
					Multiplier: 1,
				})
			}

			// Priority 3: special fuses
			// Need to figure out how these are prioritized
			for _, opt := range allSpecialFuses {
				dir1 := meetsSpecialFuseRequirement(s1, &opt.option.Requirement1) && meetsSpecialFuseRequirement(s2, &opt.option.Requirement2)
				dir2 := meetsSpecialFuseRequirement(s2, &opt.option.Requirement1) && meetsSpecialFuseRequirement(s1, &opt.option.Requirement2)
				if dir1 || dir2 {
					mult := 1
					if opt.option.IsBoosted {
						mult = cfg.SpecialFuseMultiplier
					}
					results = append(results, fuseResult{
						Type:       "special",
						ID:         opt.target,
						Multiplier: mult,
					})
				}
			}

			if len(results) == 0 {
				continue
			}

			s1Cost := cfg.FamilyFuseCost["default"]
			s2Cost := cfg.FamilyFuseCost["default"]
			for family, cost := range cfg.FamilyFuseCost {
				if cost < s1Cost && s1.Families[family] {
					s1Cost = cfg.FamilyFuseCost[family]
				}
				if cost < s2Cost && s2.Families[family] {
					s2Cost = cfg.FamilyFuseCost[family]
				}
			}

			if len(results) > 3 {
				//fmt.Printf("Shard1: %s, Shard2: %s, Results: %v\n", s1.ID, s2.ID, results)
				results = results[:3] // Limit to 3 results
			}

			s1.FuseCombinations[s2.ID] = fuseCombination{
				Shard1:  s1.ID,
				Cost1:   s1Cost,
				Shard2:  s2.ID,
				Cost2:   s2Cost,
				Results: results,
			}
		}
	}
}
