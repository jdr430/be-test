package wallet

import (
	"sync"
	"testing"
)

func TestPlaceBet_ConcurrentNoDoubleSpend(t *testing.T) {
	const startingBalance = 100.0
	const betAmount = 10.0
	const numAttempts = 100
	expectedSuccesses := int(startingBalance / betAmount)

	store := NewStoreFromSeed([]Wallet{
		{UserID: "user-1", Balance: startingBalance},
	})
	service := NewService(store)

	var wg sync.WaitGroup
	var mu sync.Mutex
	successCount := 0

	for i := 0; i < numAttempts; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := service.PlaceBet("user-1", "event-1", betAmount)
			if err == nil {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	balance, _ := service.GetBalance("user-1")

	if balance < 0 {
		t.Fatalf("balance went negative: %v — indicates race condition allowed overdraw", balance)
	}
	if successCount != expectedSuccesses {
		t.Errorf("expected exactly %d successful bets (balance %v / bet %v), got %d",
			expectedSuccesses, startingBalance, betAmount, successCount)
	}
	if balance != 0 {
		t.Errorf("expected balance 0 after exactly %d bets of %v, got %v",
			expectedSuccesses, betAmount, balance)
	}
}
