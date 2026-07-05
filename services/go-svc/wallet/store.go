package wallet

import (
	"encoding/json"
	"errors"
	"os"
	"sync"
)

type Store struct {
	mu      sync.Mutex
	wallets map[string]*Wallet
}

type Wallet struct {
	UserID  string  `json:"id"`
	Balance float64 `json:"initialBalance"`
}

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

	return &Store{wallets: wallets}, nil
}

func NewStoreFromSeed(wallets []Wallet) *Store {
	m := make(map[string]*Wallet)
	for i := range wallets {
		m[wallets[i].UserID] = &wallets[i]
	}
	return &Store{wallets: m}
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
	return nil
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
