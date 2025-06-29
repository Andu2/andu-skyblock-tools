package shards

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
