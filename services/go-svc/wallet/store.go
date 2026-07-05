package wallet

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

type Store struct {
	mu      sync.Mutex
	wallets map[string]*Wallet
	ledger  map[string][]LedgerEntry
}

type Wallet struct {
	UserID   string  `json:"id"`
	Balance  float64 `json:"initialBalance"`
	Currency string  `json:"currency"`
}

type LedgerEntry struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Amount    float64   `json:"amount"`
	CreatedAt time.Time `json:"createdAt"`
}

type WalletView struct {
	Balance  float64       `json:"balance"`
	Currency string        `json:"currency"`
	Ledger   []LedgerEntry `json:"ledger"`
}

var ledgerCounter int64

func NewStore(seedFilePath string) (*Store, error) {
	data, err := os.ReadFile(seedFilePath)
	if err != nil {
		return nil, err
	}

	var seed []Wallet
	if err := json.Unmarshal(data, &seed); err != nil {
		return nil, err
	}

	wallets := make(map[string]*Wallet)
	for i := range seed {
		wallets[seed[i].UserID] = &seed[i]
	}

	return &Store{wallets: wallets, ledger: make(map[string][]LedgerEntry)}, nil
}

func NewStoreFromSeed(wallets []Wallet) *Store {
	m := make(map[string]*Wallet)
	for i := range wallets {
		m[wallets[i].UserID] = &wallets[i]
	}
	return &Store{wallets: m, ledger: make(map[string][]LedgerEntry)}
}

func (s *Store) Debit(userID string, amount float64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[userID]
	if !ok {
		return errors.New("wallet not found")
	}
	if w.Balance < amount {
		return errors.New("insufficient funds")
	}

	w.Balance -= amount
	s.appendLedgerLocked(userID, "BET", -amount)
	return nil
}

func (s *Store) Credit(userID string, amount float64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[userID]
	if !ok {
		return errors.New("wallet not found")
	}

	w.Balance += amount
	s.appendLedgerLocked(userID, "WIN", amount)
	return nil
}

func (s *Store) appendLedgerLocked(userID, entryType string, amount float64) {
	s.ledger[userID] = append(s.ledger[userID], LedgerEntry{
		ID:        fmt.Sprintf("led-%d", atomic.AddInt64(&ledgerCounter, 1)),
		Type:      entryType,
		Amount:    amount,
		CreatedAt: time.Now(),
	})
}

func (s *Store) GetBalance(userID string) (float64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[userID]
	if !ok {
		return 0, errors.New("wallet not found")
	}

	return w.Balance, nil
}

func (s *Store) GetWallet(userID string) (*WalletView, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[userID]
	if !ok {
		return nil, errors.New("wallet not found")
	}

	// last 10 ledger entries, newest first
	entries := s.ledger[userID]
	start := 0
	if len(entries) > 10 {
		start = len(entries) - 10
	}
	recent := entries[start:]

	ledger := make([]LedgerEntry, 0, len(recent))
	for i := len(recent) - 1; i >= 0; i-- {
		ledger = append(ledger, recent[i])
	}

	return &WalletView{Balance: w.Balance, Currency: w.Currency, Ledger: ledger}, nil
}
