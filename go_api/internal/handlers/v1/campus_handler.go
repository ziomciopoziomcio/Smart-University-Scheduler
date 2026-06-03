package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}

func GetCampuses(c *gin.Context) {
	var campuses []models.Campus

	if err := db.DB.Order("id").Find(&campuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedCampusesResponse{
		Items: campuses,
	})
}

func CreateCampus(c *gin.Context) {
	var req dto.CreateCampusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	campus := models.Campus{
		CampusName:  req.CampusName,
		CampusShort: req.CampusShort,
	}

	if err := db.DB.Create(&campus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, campus)
}