package main

import (
	"flag"

	"github.com/andu2/andu-skyblock-tools/pkg/shards"
)

func main() {
	in := flag.String("in", "data/shards.json", "Input file containing shard data")
	out := flag.String("out", "data/shards_processed.json", "Output file for processed shard data")
	flag.Parse()
	shards.DumpShardData(*in, *out)
}
