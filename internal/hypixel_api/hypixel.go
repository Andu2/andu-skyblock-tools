package hypixel_api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
)

const (
	baseUrl = "https://api.hypixel.net/v2"
)

type HypixelApiRequest struct {
	Method   string
	Endpoint string // Must have leading slash
	ApiKey   string
	Query    map[string]string
}

func DoApiRequest(req HypixelApiRequest) (*http.Response, error) {
	fullUrl, err := url.Parse(baseUrl + req.Endpoint)
	if err != nil {
		return nil, err
	}
	if len(req.Query) > 0 {
		query := fullUrl.Query()
		for key, value := range req.Query {
			query.Set(key, value)
		}
		fullUrl.RawQuery = query.Encode()
	}

	httpReq, err := http.NewRequest(req.Method, fullUrl.String(), nil)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("API-Key", req.ApiKey)

	res, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	return res, nil
}

type BazaarResponse struct {
	Success  bool `json:"success"`
	Products map[string]struct {
		QuickStatus struct {
			BuyPrice  float64 `json:"buyPrice"`
			SellPrice float64 `json:"sellPrice"`
		} `json:"quick_status"`
	} `json:"products"`
}

func GetBazaar(apiKey string) (*BazaarResponse, error) {
	res, err := DoApiRequest(HypixelApiRequest{
		Method:   "GET",
		Endpoint: "/skyblock/bazaar",
		ApiKey:   apiKey,
	})
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		return nil, &url.Error{
			Op:  "GET",
			URL: baseUrl + "/skyblock/bazaar",
			Err: fmt.Errorf("unexpected status code: %d", res.StatusCode),
		}
	}

	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	bazaarResponse := BazaarResponse{}
	err = json.Unmarshal(body, &bazaarResponse)
	if err != nil {
		return nil, err
	}

	return &bazaarResponse, nil
}

type ShardBazaarOutput struct {
	ShardPrices map[string]float64 `json:"shardPrices"`
}

func DumpShardPrices(apiKey string, outFile string) {
	bazaar, err := GetBazaar(apiKey)
	if err != nil {
		log.Fatalf("Error getting bazaar data: %v", err)
	}

	shardBazaarOutput := ShardBazaarOutput{
		ShardPrices: make(map[string]float64),
	}
	for item, data := range bazaar.Products {
		if len(item) >= 6 && item[:6] == "SHARD_" {
			shardBazaarOutput.ShardPrices[item] = data.QuickStatus.BuyPrice
		}
	}

	outJson, err := json.MarshalIndent(shardBazaarOutput, "", "  ")
	if err != nil {
		log.Fatalf("Error formatting JSON: %v", err)
	}
	if err := os.WriteFile(outFile, outJson, 0644); err != nil {
		log.Fatalf("Error writing response to file: %v", err)
	}
	log.Printf("Response written to %s", outFile)
}
