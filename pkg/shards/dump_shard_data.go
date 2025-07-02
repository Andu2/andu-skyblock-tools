package shards

import (
	"encoding/json"
	"os"
)

func DumpShardData(inFile string, outFile string) {
	shards, err := processShards(inFile)
	if err != nil {
		panic(err)
	}

	// Remove special fuse details from the front-end view - only the text description is required
	for _, shard := range shards.Shards {
		shard.SpecialFuses = nil
	}

	processedShardJson, err := json.MarshalIndent(shards, "", "  ")
	if err != nil {
		panic(err)
	}

	if err := os.WriteFile(outFile, processedShardJson, 0644); err != nil {
		panic(err)
	}
}
