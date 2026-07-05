package wallet

import (
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

var ErrInsufficientFunds = errors.New("insufficient funds")
var ErrWalletNotFound = errors.New("wallet not found")

type Bet struct {
	ID        string     `json:"id"`
	UserID    string     `json:"-"`
	EventID   string     `json:"eventId"`
	Market    string     `json:"market"`
	Selection string     `json:"selection"`
	Stake     float64    `json:"stake"`
	Odds      float64    `json:"odds"`
	Status    string     `json:"status"` // "PENDING", "WON", "LOST"
	Payout    float64    `json:"payout"`
	PlacedAt  time.Time  `json:"placedAt"`
	SettledAt *time.Time `json:"settledAt"`
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

// GetBets returns a snapshot (copies) of the user's bets, newest first, so
// callers can encode them without racing concurrent settlement writes.
func (s *Service) GetBets(userID string) []Bet {
	s.mu.Lock()
	defer s.mu.Unlock()

	result := make([]Bet, 0)
	for _, b := range s.bets {
		if b.UserID == userID {
			result = append(result, *b)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].PlacedAt.After(result[j].PlacedAt)
	})
	return result
}

func (s *Service) GetBalance(userID string) (float64, error) {
	return s.store.GetBalance(userID)
}

func (s *Service) GetWallet(userID string) (*WalletView, error) {
	return s.store.GetWallet(userID)
}

func (s *Service) PlaceBet(userID, eventID, market, selection string, stake, odds float64) (*Bet, error) {
	if stake <= 0 {
		return nil, errors.New("bet amount must be positive")
	}

	// concurrent PlaceBet calls must be safe
	if err := s.store.Debit(userID, stake); err != nil {
		return nil, err // insufficient funds or wallet not found
	}

	bet := &Bet{
		ID:        generateID(),
		UserID:    userID,
		EventID:   eventID,
		Market:    market,
		Selection: selection,
		Stake:     stake,
		Odds:      odds,
		Status:    "PENDING",
		PlacedAt:  time.Now(),
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

	now := time.Now()
	s.mu.Lock()
	bet.SettledAt = &now
	if won {
		bet.Status = "WON"
		bet.Payout = bet.Stake * bet.Odds
	} else {
		bet.Status = "LOST"
	}
	s.mu.Unlock()

	// store credits are guarded by the store's own lock
	if won {
		s.store.Credit(bet.UserID, bet.Stake*bet.Odds)
	}
}

func generateID() string {
	n := atomic.AddInt64(&betCounter, 1)
	return fmt.Sprintf("bet-%d", n)
}
