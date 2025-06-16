package main

import (
	"gizantech-assignment/middleware"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Temperature struct {
	Temperature float64   `json:"temperature"`
	Unit        string    `json:"unit"`
	Timestamp   time.Time `json:"timestamp"`
}

func generateTemp() Temperature {
	return Temperature{
		Temperature: 15 + rand.Float64()*30, // 15‑45 °C
		Unit:        "Celcius",
		Timestamp:   time.Now().UTC(),
	}
}

var upgrader = websocket.Upgrader{CheckOrigin: func(_ *http.Request) bool { return true }}

func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowCredentials: true,
		AllowMethods:     []string{"GET"},
	}))

	r.Use(middleware.PerClientRateLimiter(100, 100))

	r.GET("/temperature", func(c *gin.Context) {
		c.JSON(http.StatusOK, generateTemp())
	})

	r.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("ws upgrade:", err)
			return
		}
		defer conn.Close()

		ticker := time.NewTicker(1 * time.Second)
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

	log.Println("Server listening on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
