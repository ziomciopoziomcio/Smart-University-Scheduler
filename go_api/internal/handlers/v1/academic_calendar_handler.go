package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetAcademicCalendar(c *gin.Context) {
	var calendar []models.AcademicCalendar

	if err := db.DB.Find(&calendar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": calendar,
	})
}

func CreateAcademicCalendar(c *gin.Context) {
	var calendar models.AcademicCalendar

	if err := c.ShouldBindJSON(&calendar); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&calendar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": calendar,
	})
}