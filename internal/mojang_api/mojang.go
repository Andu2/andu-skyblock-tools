package mojang_api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/url"
)

type MojangApiRequest struct {
	Method   string
	BaseUrl  string
	Endpoint string // Must have leading slash
	Payload  map[string]any
}

func DoApiRequest(req MojangApiRequest) (*http.Response, error) {
	fullUrl, err := url.Parse(req.BaseUrl + req.Endpoint)
	if err != nil {
		return nil, err
	}
	jsonPayload, err := json.Marshal(req.Payload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest(req.Method, fullUrl.String(), bytes.NewReader(jsonPayload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	return res, nil
}
