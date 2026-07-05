package wallet

import (
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

var ErrInsufficientFunds = errors.New("insufficient funds")
var ErrWalletNotFound = errors.New("wallet not found")

type Bet struct {
	ID        string
	UserID    string
	EventID   string
	Amount    float64
	Status    string // "pending", "won", "lost"
	CreatedAt time.Time
}

var betCounter int64

type Service struct {
	store *Store
	mu    sync.Mutex
	bets  map[string]*Bet // betID
}

func NewService(store *Store) *Service {
	return &Service{
		store: store,
		bets:  make(map[string]*Bet),
	}
}

func (s *Service) GetBets(userID string) []*Bet {
	var result []*Bet
	for _, b := range s.bets {
		if b.UserID == userID {
			result = append(result, b)
		}
	}
	return result
}

func (s *Service) GetBalance(userID string) (float64, error) {
	return s.store.GetBalance(userID)
}

func (s *Service) PlaceBet(userID, eventID string, amount float64) (*Bet, error) {
	if amount <= 0 {
		return nil, errors.New("bet amount must be positive")
	}

	// concurrent PlaceBet calls must be safe
	if err := s.store.Debit(userID, amount); err != nil {
		return nil, err // insufficient funds or wallet not found
	}

	bet := &Bet{
		ID:        generateID(),
		UserID:    userID,
		EventID:   eventID,
		Amount:    amount,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	// since s.bets map is also shared mutable state
	s.mu.Lock()
	s.bets[bet.ID] = bet
	s.mu.Unlock()

	// Fire-and-forget async settlement
	go s.settleAfterDelay(bet)

	return bet, nil
}

func (s *Service) settleAfterDelay(bet *Bet) {
	time.Sleep(30 * time.Second)

	won := rand.Float64() < 0.45 // 45% win chance per spec

	s.mu.Lock()
	if won {
		bet.Status = "won"
	} else {
		bet.Status = "lost"
	}
	s.mu.Unlock()

	// store wins - no need for lock as its already in store
	if won {
		s.store.Credit(bet.UserID, bet.Amount*2)
	}
}

func generateID() string {
	n := atomic.AddInt64(&betCounter, 1)
	return fmt.Sprintf("bet-%d", n)
}
