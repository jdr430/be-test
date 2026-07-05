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
		getBalanceHandler(service, w, r)
	}))

	http.HandleFunc("/bets", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getBetsHandler(service, w, r)
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

func getBetsHandler(service *wallet.Service, w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	bets := service.GetBets(userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bets)
}

func getBalanceHandler(service *wallet.Service, w http.ResponseWriter, r *http.Request) {
	// /wallet/{userId} — extract from path
	userID := strings.TrimPrefix(r.URL.Path, "/wallet/")

	balance, err := service.GetBalance(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]float64{"balance": balance})
}
