package main

import (
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

	r.Run(":8080")
}
