package shards

import "slices"

type shard struct {
	ID                string                     `json:"id"`
	BazaarId          string                     `json:"bazaarId"`
	Name              string                     `json:"name"`
	Rarity            rarity                     `json:"rarity"`
	Number            int                        `json:"number"`
	AttributeName     string                     `json:"attributeName"`
	Category          category                   `json:"category"`
	Skill             string                     `json:"skill"`
	Families          map[string]bool            `json:"families"`
	IsBasicFuseTarget bool                       `json:"isBasicFuseTarget"`
	Sources           []string                   `json:"sources"`
	SpecialFuses      []specialFuse              `json:"specialFuses"`
	BasicFuseTarget   string                     `json:"basicFuseTarget"`
	ChameleonTargets  []string                   `json:"chameleonTargets"`
	FuseCombinations  map[string]fuseCombination `json:"fuseCombinations"`
}

type specialFuse struct {
	IsBoosted    bool                   `json:"isBoosted"`
	Requirement1 specialFuseRequirement `json:"requirement1"`
	Requirement2 specialFuseRequirement `json:"requirement2"`
}

type specialFuseRequirement struct {
	Rarity   []string `json:"rarity,omitempty"`
	Category []string `json:"category,omitempty"`
	Shard    []string `json:"shard,omitempty"`
	Family   []string `json:"family,omitempty"`
}

type fuseCombination struct {
	Shard1  string       `json:"shard1"`
	Cost1   int          `json:"cost1"`
	Shard2  string       `json:"shard2"`
	Cost2   int          `json:"cost2"`
	Results []fuseResult `json:"results"`
}

type fuseResult struct {
	Type       string `json:"type"`
	ID         string `json:"id"`
	Multiplier int    `json:"multiplier"`
}

func rarityValue(r rarity) int {
	switch r {
	case rarityCommon:
		return 1
	case rarityUncommon:
		return 2
	case rarityRare:
		return 3
	case rarityEpic:
		return 4
	case rarityLegendary:
		return 5
	default:
		return 0 // Unknown rarity
	}
}

func getRarityAbbreviation(r rarity) string {
	switch r {
	case rarityCommon:
		return "C"
	case rarityUncommon:
		return "U"
	case rarityRare:
		return "R"
	case rarityEpic:
		return "E"
	case rarityLegendary:
		return "L"
	default:
		return ""
	}
}

func getNextRarity(r rarity) rarity {
	switch r {
	case rarityCommon:
		return rarityUncommon
	case rarityUncommon:
		return rarityRare
	case rarityRare:
		return rarityEpic
	case rarityEpic:
		return rarityLegendary
	default:
		return ""
	}
}

func getSortedShards(shards map[string]*shard) []*shard {
	sortedShards := make([]*shard, 0, len(shards))
	for _, s := range shards {
		sortedShards = append(sortedShards, s)
	}
	slices.SortFunc(sortedShards, func(a, b *shard) int {
		sortNumA := a.Number + rarityValue(a.Rarity)*1000
		sortNumB := b.Number + rarityValue(b.Rarity)*1000
		return sortNumA - sortNumB
	})
	return sortedShards
}
