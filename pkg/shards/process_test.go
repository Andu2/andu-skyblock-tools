package shards

import (
	"testing"
)

const testShardDataLocation = "../../data/shards.json"

var confirmedResults = []fuseCombination{
	{
		Shard1: "R53",
		Cost1:  2,
		Shard2: "C19",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "R56", Multiplier: 1},
			{Type: "basic", ID: "C25", Multiplier: 1},
			{Type: "special", ID: "R58", Multiplier: 2},
		},
	},
	{
		Shard1: "R6",
		Cost1:  5,
		Shard2: "C19",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "R18", Multiplier: 1},
			{Type: "basic", ID: "C25", Multiplier: 1},
			{Type: "special", ID: "R58", Multiplier: 2},
		},
	},
	{
		Shard1: "R6",
		Cost1:  5,
		Shard2: "U11",
		Cost2:  2,
		Results: []fuseResult{
			{Type: "basic", ID: "R18", Multiplier: 1},
			{Type: "basic", ID: "U20", Multiplier: 1},
			{Type: "special", ID: "U2", Multiplier: 2},
		},
	},
	{
		Shard1: "R6",
		Cost1:  5,
		Shard2: "C9",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "R18", Multiplier: 1},
			{Type: "special", ID: "R15", Multiplier: 2},
			{Type: "special", ID: "C3", Multiplier: 2},
		},
	},
	{
		Shard1: "C9",
		Cost1:  5,
		Shard2: "R6",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "R18", Multiplier: 1},
			{Type: "special", ID: "R15", Multiplier: 2},
			{Type: "special", ID: "C3", Multiplier: 2},
		},
	},
	{
		Shard1: "C19",
		Cost1:  5,
		Shard2: "R61",
		Cost2:  2,
		Results: []fuseResult{
			{Type: "special", ID: "R58", Multiplier: 2},
			{Type: "special", ID: "U34", Multiplier: 2},
			{Type: "special", ID: "C1", Multiplier: 2},
		},
	},
	{
		Shard1: "C19",
		Cost1:  5,
		Shard2: "E26",
		Cost2:  2,
		Results: []fuseResult{
			{Type: "basic", ID: "C25", Multiplier: 1},
			{Type: "special", ID: "E28", Multiplier: 2},
			{Type: "special", ID: "R58", Multiplier: 2},
		},
	},
	{
		Shard1: "E26",
		Cost1:  2,
		Shard2: "C10",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "C25", Multiplier: 1},
			{Type: "special", ID: "U9", Multiplier: 2},
			{Type: "special", ID: "C1", Multiplier: 2},
		},
	},
	{
		Shard1: "C11",
		Cost1:  5,
		Shard2: "C27",
		Cost2:  5,
		Results: []fuseResult{
			{Type: "basic", ID: "C14", Multiplier: 1},
			{Type: "basic", ID: "C29", Multiplier: 1},
			{Type: "special", ID: "U5", Multiplier: 1},
		},
	},
}

func TestProcessShardConfig(t *testing.T) {
	shardData, err := processShards(testShardDataLocation)

	// fmt.Printf("Shard: %v\n", shards["C1"])

	if err != nil {
		t.Fatalf("Failed to process shard config: %v", err)
	}

	if len(shardData.Shards) == 0 {
		t.Error("Expected non-empty shards map")
	}

	for _, result := range confirmedResults {
		s1, ok := shardData.Shards[result.Shard1]
		if !ok {
			t.Errorf("Shard %s not found in processed shards", result.Shard1)
			continue
		}

		combo, ok := s1.FuseCombinations[result.Shard2]
		if !ok {
			t.Errorf("Fusion combination for %s and %s not found", result.Shard1, result.Shard2)
			continue
		}

		if combo.Cost1 != result.Cost1 {
			t.Errorf("Expected Cost1 %d for %s, got %d", result.Cost1, result.Shard1, combo.Cost1)
		}

		if combo.Cost2 != result.Cost2 {
			t.Errorf("Expected Cost2 %d for %s, got %d", result.Cost2, result.Shard2, combo.Cost2)
		}

		if len(combo.Results) != len(result.Results) {
			t.Errorf("Expected %d results for %s+%s, got %d", len(result.Results), result.Shard1, result.Shard2, len(combo.Results))
			continue
		}

		for i, expectedResult := range result.Results {
			actualResult := combo.Results[i]

			if actualResult.Type != expectedResult.Type {
				t.Errorf("Expected result type %s for %s+%s result %d, got %s", expectedResult.Type, result.Shard1, result.Shard2, i, actualResult.Type)
			}

			if actualResult.ID != expectedResult.ID {
				t.Errorf("Expected result ID %s for %s+%s result %d, got %s", expectedResult.ID, result.Shard1, result.Shard2, i, actualResult.ID)
			}

			if actualResult.Multiplier != expectedResult.Multiplier {
				t.Errorf("Expected result multiplier %d for %s+%s result %d, got %d", expectedResult.Multiplier, result.Shard1, result.Shard2, i, actualResult.Multiplier)
			}
		}
	}
}
