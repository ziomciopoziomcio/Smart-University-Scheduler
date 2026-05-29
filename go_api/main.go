package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/models"
)

func main() {
	db.Connect()

	r := gin.Default()

	// HEALTH
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// CAMPUSES
	r.GET("/campuses", func(c *gin.Context) {
		var campuses []models.Campus

		if err := db.DB.Preload("Buildings").Find(&campuses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": campuses})
	})

	r.POST("/campuses", func(c *gin.Context) {
		var campus models.Campus

		if err := c.ShouldBindJSON(&campus); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.DB.Create(&campus).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": campus})
	})

	// BUILDINGS
	r.GET("/buildings", func(c *gin.Context) {
		var buildings []models.Building

		if err := db.DB.Preload("Campus").
			Preload("Rooms").
			Preload("Faculties").
			Find(&buildings).Error; err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": buildings})
	})

	r.POST("/buildings", func(c *gin.Context) {
		var building models.Building

		if err := c.ShouldBindJSON(&building); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.DB.Create(&building).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": building})
	})

	// ROOMS
	r.GET("/rooms", func(c *gin.Context) {
		var rooms []models.Room

		if err := db.DB.Preload("Building").
			Preload("Faculty").
			Find(&rooms).Error; err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": rooms})
	})

	r.POST("/rooms", func(c *gin.Context) {
		var room models.Room

		if err := c.ShouldBindJSON(&room); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.DB.Create(&room).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": room})
	})

	// FACULTIES
	r.GET("/faculties", func(c *gin.Context) {
		var faculties []models.Faculty

		if err := db.DB.Preload("Buildings").Find(&faculties).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": faculties})
	})

	r.POST("/faculties", func(c *gin.Context) {
		var faculty models.Faculty

		if err := c.ShouldBindJSON(&faculty); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.DB.Create(&faculty).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": faculty})
	})


	r.Run(":8080")
}

