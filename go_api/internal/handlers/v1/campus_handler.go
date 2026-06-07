package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCampuses godoc
// @Summary Get all campuses
// @Description Returns list of all campuses
// @Tags campuses
// @Produce json
// @Success 200 {object} models.PaginatedCampusesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/campuses [get]
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

// CreateCampus godoc
// @Summary Create campus
// @Description Creates a new campus.
// @Tags campuses
// @Accept json
// @Produce json
// @Param request body dto.CreateCampusRequest true "Campus data"
// @Success 201 {object} models.Campus
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/campuses [post]
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
