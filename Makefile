SHELL := /bin/bash

get_shard_prices:
	set -a && source .env && set +a && go run ./cmd/get_shard_prices/main.go

process_shards:
	set -a && source .env && set +a && go run ./cmd/process_shards/main.go
