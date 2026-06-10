// Service skeleton. Replace with your implementation.
// See README.md for the contract this service must serve.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok","service":"go-svc"}`)
	})

	log.Printf("go-svc listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
