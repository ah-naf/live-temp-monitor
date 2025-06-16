package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	clients = make(map[string]*client)
	mu      sync.Mutex
)

func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, c := range clients {
				if time.Since(c.lastSeen) > 3*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func getClientLimiter(ip string, rps, cap int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	if c, exists := clients[ip]; exists {
		c.lastSeen = time.Now()
		return c.limiter
	}

	limiter := rate.NewLimiter(rate.Limit(rps), cap)
	clients[ip] = &client{limiter: limiter, lastSeen: time.Now()}
	return limiter
}

func PerClientRateLimiter(rps, burst int) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		limiter := getClientLimiter(ctx.ClientIP(), rps, burst)
		if !limiter.Allow() {
			abortJSON(ctx, http.StatusTooManyRequests, "Too Many Requests")
			return
		}
		ctx.Next()
	}
}

func abortJSON(c *gin.Context, code int, msg string) {
	c.AbortWithStatusJSON(code, gin.H{"error": msg, "timestamp": time.Now().UTC()})
}
