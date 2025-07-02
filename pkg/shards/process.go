package shards

import (
	"encoding/json"
	"fmt"
	"os"
	"slices"
	"strconv"
)

type shardConfig struct {
	Skills                []string                   `json:"skills"`
	Families              []string                   `json:"families"`
	SourceTypes           []string                   `json:"sourceTypes"`
	EffectTags            []string                   `json:"effectTags"`
	CostToMax             map[string]int             `json:"costToMax"`
	FamilyFuseCost        map[string]int             `json:"familyFuseCost"`
	SpecialFuseMultiplier int                        `json:"specialFuseMultiplier"`
	Shards                map[string]shardConfigData `json:"shards"`
}

type shardConfigData struct {
	Name              string        `json:"name"`
	BazaarId          string        `json:"bazaarId"`
	AttributeName     string        `json:"attributeName"`
	EffectDescription string        `json:"effectDescription"`
	EffectMax         float64       `json:"effectMax"`
	Effect2Max        float64       `json:"effect2Max"`
	EffectTags        []string      `json:"effectTags"`
	Category          string        `json:"category"`
	Skill             string        `json:"skill"`
	Families          []string      `json:"families"`
	IsBasicFuseTarget bool          `json:"isBasicFuseTarget"`
	Sources           []source      `json:"sources"`
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

type processedShardData struct {
	FamilyShards           map[string][]string         `json:"familyShards"`
	CategoryShards         map[category][]string       `json:"categoryShards"`
	SkillShards            map[string][]string         `json:"skillShards"`
	RarityShards           map[rarity][]string         `json:"rarityShards"`
	TagShards              map[string][]string         `json:"tagShards"`
	SourceTypeShards       map[string][]string         `json:"sourceTypeShards"`
	CostToMax              map[string]int              `json:"costToMax"`
	Shards                 map[string]*shard           `json:"shards"`
	SpecialRequirements    []string                    `json:"specialRequirements"`
	SpecialRequirementInfo map[string]*requirementInfo `json:"specialRequirementInfo"`
}

func processShards(filePath string) (*processedShardData, error) {
	config, err := loadShardConfig(filePath)
	if err != nil {
		return nil, fmt.Errorf("error loading shard config: %v", err)
	}

	// Categorize these in a bunch of ways to minimize front-end logic
	familyShards := make(map[string][]string, len(config.Families))
	for _, family := range config.Families {
		familyShards[family] = make([]string, 0, 20)
	}
	categoryShards := make(map[category][]string, 3)
	for _, cat := range []category{categoryForest, categoryWater, categoryCombat} {
		categoryShards[cat] = make([]string, 0, 100)
	}
	skillShards := make(map[string][]string, len(config.Skills))
	for _, skill := range config.Skills {
		skillShards[skill] = make([]string, 0, 50)
	}
	rarityShards := make(map[rarity][]string, 5)
	for _, r := range []rarity{rarityCommon, rarityUncommon, rarityRare, rarityEpic, rarityLegendary} {
		rarityShards[r] = make([]string, 0, 100)
	}
	tagShards := make(map[string][]string, len(config.EffectTags))
	for _, tag := range config.EffectTags {
		tagShards[tag] = make([]string, 0, 10)
	}
	sourceTypeShards := make(map[string][]string, len(config.SourceTypes))
	for _, sourceType := range config.SourceTypes {
		sourceTypeShards[sourceType] = make([]string, 0, 100)
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

		effectTags, err := processTags(data.EffectTags, config.EffectTags)
		if err != nil {
			return nil, fmt.Errorf("error processing effect tags for shard ID %s: %v", id, err)
		}

		if err := validateSpecialFuses(data.SpecialFuses); err != nil {
			return nil, fmt.Errorf("error validating special fuses for shard ID %s: %v", id, err)
		}

		rarityShards[rarity] = append(rarityShards[rarity], id)
		categoryShards[category] = append(categoryShards[category], id)
		skillShards[data.Skill] = append(skillShards[data.Skill], id)
		for tag := range effectTags {
			tagShards[tag] = append(tagShards[tag], id)
		}
		for family := range families {
			familyShards[family] = append(familyShards[family], id)
		}

		sources := data.Sources
		if len(sources) == 0 {
			sources = []source{
				{SourceType: "fusionOnly", SourceDesc: "Fusion Only"},
			}
		}
		for _, source := range sources {
			sourceTypeShards[source.SourceType] = append(sourceTypeShards[source.SourceType], id)
		}

		specialFusesDesc := make([][]string, 0, len(data.SpecialFuses))
		for _, sf := range data.SpecialFuses {
			desc1 := getRequirementDescription(&sf.Requirement1)
			desc2 := getRequirementDescription(&sf.Requirement2)
			desc := []string{desc1, desc2}
			specialFusesDesc = append(specialFusesDesc, desc)
		}

		shard := &shard{
			ID:                id,
			BazaarId:          data.BazaarId,
			Name:              data.Name,
			Rarity:            rarity,
			Number:            number,
			AttributeName:     data.AttributeName,
			EffectDescription: data.EffectDescription,
			EffectMax:         data.EffectMax,
			Effect2Max:        data.Effect2Max,
			EffectTags:        effectTags,
			Category:          category,
			Skill:             data.Skill,
			Families:          families,
			IsBasicFuseTarget: data.IsBasicFuseTarget,
			Sources:           sources,
			SpecialFuses:      data.SpecialFuses,
			SpecialFusesDesc:  specialFusesDesc,

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

	requirementInfo := collectRequirementInfo(shards)
	requirementList := make([]string, 0, len(requirementInfo))
	for req := range requirementInfo {
		requirementList = append(requirementList, req)
	}
	slices.SortFunc(requirementList, func(a, b string) int {
		return len(requirementInfo[b].Targets) - len(requirementInfo[a].Targets)
	})

	for _, shardIds := range familyShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}
	for _, shardIds := range categoryShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}
	for _, shardIds := range skillShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}
	for _, shardIds := range rarityShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}
	for _, shardIds := range tagShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}
	for _, shardIds := range sourceTypeShards {
		slices.SortFunc(shardIds, func(a, b string) int {
			return getShardSortValue(shards[a]) - getShardSortValue(shards[b])
		})
	}

	shardData := &processedShardData{
		FamilyShards:           familyShards,
		CategoryShards:         categoryShards,
		SkillShards:            skillShards,
		RarityShards:           rarityShards,
		TagShards:              tagShards,
		SourceTypeShards:       sourceTypeShards,
		CostToMax:              config.CostToMax,
		Shards:                 shards,
		SpecialRequirementInfo: requirementInfo,
		SpecialRequirements:    requirementList,
	}

	return shardData, nil
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
	if slices.Contains(familyConfig, family) {
		return nil
	}
	return fmt.Errorf("invalid family: %s", family)
}

func processTags(tags []string, tagConfig []string) (map[string]bool, error) {
	tagMap := make(map[string]bool)
	for _, tag := range tags {
		if validateTag(tag, tagConfig) != nil {
			return nil, fmt.Errorf("invalid tag: %s", tag)
		}
		tagMap[tag] = true
	}
	return tagMap, nil
}

func validateTag(tag string, tagConfig []string) error {
	if slices.Contains(tagConfig, tag) {
		return nil
	}
	return fmt.Errorf("invalid tag: %s", tag)
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
