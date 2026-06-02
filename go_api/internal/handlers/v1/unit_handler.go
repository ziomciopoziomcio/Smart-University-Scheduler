package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)


func GetUnits(c *gin.Context) {
	var units []models.Unit

	if err := db.DB.
		Preload("Faculty").
		Find(&units).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": units,
	})
}

func CreateUnit(c *gin.Context) {
	var unit models.Unit

	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// faculty exists?
	var faculty models.Faculty
	if err := db.DB.First(&faculty, unit.FacultyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "faculty not found",
		})
		return
	}


	if err := db.DB.Create(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.
		Preload("Faculty").
		First(&unit, unit.ID).Error; err != nil {

		c.JSON(http.StatusCreated, gin.H{
			"data": unit,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": unit,
	})
}