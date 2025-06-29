package main

import (
	"flag"
	"os"

	"github.com/andu2/andu-skyblock-tools/internal/hypixel_api"
)

func main() {
	out := flag.String("out", "data/shard_prices.json", "Output file for shard prices")
	flag.Parse()
	apiKey := os.Getenv("HYPIXEL_API_KEY")
	if apiKey == "" {
		panic("HYPIXEL_API_KEY environment variable is not set")
	}
	hypixel_api.DumpShardPrices(apiKey, *out)
}
