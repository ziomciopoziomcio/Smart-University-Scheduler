package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/app"
	"go_api/internal/routes"
)

func main() {
	database, err := db.Connect()
	if err != nil {
		return
	}

	application := &app.App{
		DB: database,
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok_new22",
		})
	})

	routes.RegisterV1Routes(r, application)

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
