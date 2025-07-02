package shards

import (
	"strings"
)

func meetsSpecialFuseRequirement(shard *shard, req *specialFuseRequirement) bool {
	if len(req.Rarity) > 0 {
		meetsOne := false
		for _, r := range req.Rarity {
			baseRarity := rarity(r)
			compare := "eq"
			if r[len(r)-1:] == "+" {
				baseRarity = rarity(r[:len(r)-1])
				compare = "ge"
			}

			if compare == "eq" {
				if shard.Rarity == baseRarity {
					meetsOne = true
					break
				}
			} else if compare == "ge" {
				shardRarityVal := rarityValue(shard.Rarity)
				reqRarityVal := rarityValue(baseRarity)
				if shardRarityVal >= reqRarityVal {
					meetsOne = true
					break
				}
			}
		}
		if !meetsOne {
			return false
		}
	}

	if len(req.Category) > 0 {
		meetsOne := false
		for _, c := range req.Category {
			if shard.Category == category(c) {
				meetsOne = true
				break
			}
		}
		if !meetsOne {
			return false
		}
	}

	if len(req.Shard) > 0 {
		meetsOne := false
		for _, s := range req.Shard {
			if shard.ID == s {
				meetsOne = true
				break
			}
		}
		if !meetsOne {
			return false
		}
	}

	if len(req.Family) > 0 {
		meetsOne := false
		for _, f := range req.Family {
			if shard.Families[f] {
				meetsOne = true
				break
			}
		}
		if !meetsOne {
			return false
		}
	}

	return true
}

// This lets us identify requirements that are the same
func getRequirementDescription(req *specialFuseRequirement) string {
	descs := make([]string, 0, 4)

	if len(req.Shard) > 0 {
		descs = append(descs, "Shard: "+strings.Join(req.Shard, " or "))
	}
	if len(req.Family) > 0 {
		descs = append(descs, "Family: "+strings.Join(req.Family, " or "))
	}
	if len(req.Category) > 0 {
		descs = append(descs, "Category: "+strings.Join(req.Category, " or "))
	}
	if len(req.Rarity) > 0 {
		descs = append(descs, "Rarity: "+strings.Join(req.Rarity, " or "))
	}

	return strings.Join(descs, " and ")
}

type requirementInfo struct {
	Targets     []string `json:"targets"`
	Matches     []string `json:"matches,omitempty"`
	Description string   `json:"description"`
}

func collectRequirementInfo(shards map[string]*shard) map[string]*requirementInfo {
	requirements := make(map[string]*requirementInfo)

	for _, s := range shards {
		for _, fuse := range s.SpecialFuses {
			for _, req := range []specialFuseRequirement{fuse.Requirement1, fuse.Requirement2} {
				reqDesc := getRequirementDescription(&req)
				processedReq, exists := requirements[reqDesc]
				if !exists {
					newProcessedReq := &requirementInfo{
						Targets:     make([]string, 0),
						Matches:     make([]string, 0),
						Description: reqDesc,
					}
					newProcessedReq.Targets = append(newProcessedReq.Targets, s.ID)

					// Get matches
					for possibleMatchId, possibleMatch := range shards {
						if meetsSpecialFuseRequirement(possibleMatch, &req) {
							newProcessedReq.Matches = append(newProcessedReq.Matches, possibleMatchId)
						}
					}

					requirements[reqDesc] = newProcessedReq
				} else {
					processedReq.Targets = append(processedReq.Targets, s.ID)
				}
			}
		}
	}

	return requirements
}
