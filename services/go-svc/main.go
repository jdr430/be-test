// Service skeleton. Replace with your implementation.
// See README.md for the contract this service must serve.
package main

import (
	"encoding/json"
	"fmt"
	"github.com/flotaro/be-test/services/go-svc/middleware"
	"github.com/flotaro/be-test/services/go-svc/wallet"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("no .env file found, relying on environment:", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	store, err := wallet.NewStore("../../data/users.json")
	if err != nil {
		log.Fatal("failed to load wallet seed data:", err)
	}

	service := wallet.NewService(store)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok","service":"go-svc"}`)
	})

	http.HandleFunc("/wallet/", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		getWalletHandler(service, w, r)
	}))

	http.HandleFunc("/bets", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getBetsHandler(service, w, r)
		case http.MethodPost:
			placeBetHandler(service, w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	log.Printf("go-svc listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, withCORS(http.DefaultServeMux)))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func placeBetHandler(service *wallet.Service, w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID    string  `json:"userId"`
		EventID   string  `json:"eventId"`
		SportKey  string  `json:"sportKey"`
		Market    string  `json:"market"`
		Selection string  `json:"selection"`
		Stake     float64 `json:"stake"`
		Odds      float64 `json:"odds"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	bet, err := service.PlaceBet(req.UserID, req.EventID, req.Market, req.Selection, req.Stake, req.Odds)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"betId": bet.ID, "status": bet.Status})
}

func getBetsHandler(service *wallet.Service, w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	bets := service.GetBets(userID)

	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n >= 0 && n < len(bets) {
			bets = bets[:n]
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bets)
}

func getWalletHandler(service *wallet.Service, w http.ResponseWriter, r *http.Request) {
	// /wallet/{userId} — extract from path
	userID := strings.TrimPrefix(r.URL.Path, "/wallet/")

	view, err := service.GetWallet(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(view)
}
