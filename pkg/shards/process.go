package shards

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
)

type rarity string
type category string

const (
	rarityCommon    rarity   = "common"
	rarityUncommon  rarity   = "uncommon"
	rarityRare      rarity   = "rare"
	rarityEpic      rarity   = "epic"
	rarityLegendary rarity   = "legendary"
	categoryForest  category = "forest"
	categoryWater   category = "water"
	categoryCombat  category = "combat"
)

type shardConfig struct {
	Families              []string                   `json:"families"`
	FamilyFuseCost        map[string]int             `json:"familyFuseCost"`
	SpecialFuseMultiplier int                        `json:"specialFuseMultiplier"`
	Shards                map[string]shardConfigData `json:"shards"`
}

type shardConfigData struct {
	Name              string        `json:"name"`
	BazaarId          string        `json:"bazaarId"`
	AttributeName     string        `json:"attributeName"`
	Category          string        `json:"category"`
	Skill             string        `json:"skill"`
	Families          []string      `json:"families"`
	IsBasicFuseTarget bool          `json:"isBasicFuseTarget"`
	Sources           []string      `json:"sources"`
	SpecialFuses      []specialFuse `json:"specialFuses"`
}

func loadShardConfig(filePath string) (*shardConfig, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read shard data file: %v", err)
	}

	var config shardConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal shard data: %v", err)
	}

	return &config, nil
}

func processShards(filePath string) (map[string]*shard, error) {
	config, err := loadShardConfig(filePath)
	if err != nil {
		return nil, fmt.Errorf("error loading shard config: %v", err)
	}

	shards := make(map[string]*shard)
	for id, data := range config.Shards {
		rarity, number, err := processId(id)
		if err != nil {
			return nil, fmt.Errorf("error processing shard ID %s: %v", id, err)
		}

		category, err := validateCategory(data.Category)
		if err != nil {
			return nil, fmt.Errorf("error validating category for shard ID %s: %v", id, err)
		}

		families, err := processFamilies(data.Families, config.Families)
		if err != nil {
			return nil, fmt.Errorf("error processing families for shard ID %s: %v", id, err)
		}

		if err := validateSpecialFuses(data.SpecialFuses); err != nil {
			return nil, fmt.Errorf("error validating special fuses for shard ID %s: %v", id, err)
		}

		shard := &shard{
			ID:                id,
			BazaarId:          data.BazaarId,
			Name:              data.Name,
			Rarity:            rarity,
			Number:            number,
			AttributeName:     data.AttributeName,
			Category:          category,
			Skill:             data.Skill,
			Families:          families,
			IsBasicFuseTarget: data.IsBasicFuseTarget,
			Sources:           data.Sources,
			SpecialFuses:      data.SpecialFuses,

			// The rest get filled in later
			FuseCombinations: make(map[string]fuseCombination),
			ChameleonTargets: make([]string, 0, 3),
		}

		for _, family := range data.Families {
			shard.Families[family] = true
		}

		shards[id] = shard
	}

	addBasicFusionTargets(shards)
	addChameleonFusionTargets(shards)
	addFuseCombos(shards, config)

	return shards, nil
}

func processId(id string) (rarity, int, error) {
	var rarity rarity
	var number int

	if len(id) < 2 {
		return "", 0, fmt.Errorf("invalid shard ID: %s", id)
	}

	rarityIndicator := id[0]
	switch rarityIndicator {
	case 'C':
		rarity = rarityCommon
	case 'U':
		rarity = rarityUncommon
	case 'R':
		rarity = rarityRare
	case 'E':
		rarity = rarityEpic
	case 'L':
		rarity = rarityLegendary
	default:
		return "", 0, fmt.Errorf("unknown rarity in shard ID: %s", id)
	}

	number, err := strconv.Atoi(id[1:])
	if err != nil {
		return "", 0, fmt.Errorf("invalid number in shard ID %s: %v", id, err)
	}

	return rarity, number, nil
}

func validateRarity(r string) (rarity, error) {
	switch r {
	case "common":
		return rarityCommon, nil
	case "uncommon":
		return rarityUncommon, nil
	case "rare":
		return rarityRare, nil
	case "epic":
		return rarityEpic, nil
	case "legendary":
		return rarityLegendary, nil
	default:
		return "", fmt.Errorf("invalid rarity: %s", r)
	}
}

func validateCategory(c string) (category, error) {
	switch c {
	case "forest":
		return categoryForest, nil
	case "water":
		return categoryWater, nil
	case "combat":
		return categoryCombat, nil
	default:
		return "", fmt.Errorf("invalid category: %s", c)
	}
}

func processFamilies(families []string, familyConfig []string) (map[string]bool, error) {
	familyMap := make(map[string]bool)
	for _, family := range families {
		if validateFamily(family, familyConfig) != nil {
			return nil, fmt.Errorf("invalid family: %s", family)
		}
		familyMap[family] = true
	}
	return familyMap, nil
}

func validateFamily(family string, familyConfig []string) error {
	for _, f := range familyConfig {
		if f == family {
			return nil
		}
	}
	return fmt.Errorf("invalid family: %s", family)
}

func validateSpecialFuses(specialFuses []specialFuse) error {
	for _, sf := range specialFuses {
		if err := validateSpecialFuseRequirement(sf.Requirement1); err != nil {
			return fmt.Errorf("invalid special fuse requirement: %v", err)
		}
		if err := validateSpecialFuseRequirement(sf.Requirement2); err != nil {
			return fmt.Errorf("invalid special fuse requirement: %v", err)
		}
	}

	return nil
}

func validateSpecialFuseRequirement(req specialFuseRequirement) error {
	if len(req.Rarity) == 0 && len(req.Category) == 0 && len(req.Shard) == 0 && len(req.Family) == 0 {
		return fmt.Errorf("special fuse requirement must have at least one condition")
	}
	for _, r := range req.Rarity {
		baseRarity := r
		if r[len(r)-1:] == "+" {
			baseRarity = r[:len(r)-1]
		}
		if _, err := validateRarity(baseRarity); err != nil {
			return fmt.Errorf("invalid rarity in special fuse requirement: %s", baseRarity)
		}
	}
	for _, c := range req.Category {
		if _, err := validateCategory(c); err != nil {
			return fmt.Errorf("invalid category in special fuse requirement: %s", c)
		}
	}

	return nil
}
