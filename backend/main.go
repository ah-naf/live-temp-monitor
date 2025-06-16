package main

import (
	"gizantech-assignment/middleware"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type Temperature struct {
	Temperature float64   `json:"temperature"`
	Unit        string    `json:"unit"`
	Timestamp   time.Time `json:"timestamp"`
}

func generateTemp() Temperature {
	return Temperature{
		Temperature: 15 + rand.Float64()*35, // 15‑50 °C
		Unit:        "Celcius",
		Timestamp:   time.Now().UTC(),
	}
}

var upgrader = websocket.Upgrader{CheckOrigin: func(_ *http.Request) bool { return true }}

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	origin := os.Getenv("FRONTEND_ORIGIN")
	if origin == "" {
		origin = "http://localhost:5173"
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{origin},
		AllowCredentials: true,
		AllowMethods:     []string{"GET"},
	}))

	api := r.Group("/")
	api.Use(middleware.PerClientRateLimiter(100, 100))
	{
		api.GET("/temperature", func(c *gin.Context) {
			c.JSON(http.StatusOK, generateTemp())
		})
	}

	r.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("ws upgrade:", err)
			return
		}
		defer conn.Close()

		const (
			defaultMs = 1000
			minMs     = 1000
			maxMs     = 60000
		)

		msStr := c.Query("period")
		periodMs := defaultMs
		if msStr != "" {
			if v, err := strconv.Atoi(msStr); err == nil && v >= minMs && v <= maxMs {
				periodMs = v
			}
		}
		period := time.Duration(periodMs) * time.Millisecond
		log.Printf("client %s streaming every %v", c.ClientIP(), period)

		ticker := time.NewTicker(period)
		defer ticker.Stop()

		for t := range ticker.C {
			payload := Temperature{
				Temperature: 15 + rand.Float64()*30,
				Unit:        "°C",
				Timestamp:   t.UTC(),
			}
			if err := conn.WriteJSON(payload); err != nil {
				log.Println("ws write:", err)
				return
			}
		}
	})

	log.Println("Server listening on :", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
