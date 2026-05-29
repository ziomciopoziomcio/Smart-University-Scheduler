package main

import (
    "net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/routes"
)

func main() {
	db.Connect()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok_new",
		})
	})

	routes.RegisterRoutes(r)

	r.Run(":8080")
}