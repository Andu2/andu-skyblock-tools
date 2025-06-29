package shards

import "strconv"

const chameleonId = "L4"

func addChameleonFusionTargets(shards map[string]*shard) {
	for _, s := range shards {
		numFound := 0

		rarityIndicator := getRarityAbbreviation(s.Rarity)
		for nextNum := s.Number + 1; nextNum < s.Number+4; nextNum++ {
			nextId := rarityIndicator + strconv.Itoa(nextNum)
			if fuseTarget, exists := shards[nextId]; exists {
				s.ChameleonTargets = append(s.ChameleonTargets, fuseTarget.ID)
				numFound++
			}
		}

		if numFound == 3 {
			continue
		}

		nextRarity := getNextRarity(s.Rarity)
		if nextRarity == "" {
			continue
		}
		nextRarityIndicator := getRarityAbbreviation(nextRarity)
		for nextNum := 1; nextNum < 4; nextNum++ {
			nextId := nextRarityIndicator + strconv.Itoa(nextNum)
			if fuseTarget, exists := shards[nextId]; exists {
				s.ChameleonTargets = append(s.ChameleonTargets, fuseTarget.ID)
				numFound++
				if numFound >= 3 {
					break
				}
			}
		}
	}
}
