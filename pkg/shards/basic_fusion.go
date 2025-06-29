package shards

func addBasicFusionTargets(shards map[string]*shard) {
	sortedShards := getSortedShards(shards)

	for i := 0; i < len(sortedShards); i++ {
		fuser := sortedShards[i]
		for j := i + 1; j < len(sortedShards); j++ {
			fuseCandidate := sortedShards[j]
			if fuser.Rarity != fuseCandidate.Rarity {
				break
			}
			if fuser.Category != fuseCandidate.Category {
				continue
			}
			if fuseCandidate.IsBasicFuseTarget {
				fuser.BasicFuseTarget = fuseCandidate.ID
				break
			}
		}
	}
}
