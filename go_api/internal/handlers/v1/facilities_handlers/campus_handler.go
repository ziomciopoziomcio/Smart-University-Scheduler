package facilities_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCampuses godoc
// @Summary Get all campuses
// @Description Returns paginated list of all campuses
// @Tags campuses
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedCampusesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/campuses [get]
func GetCampuses(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		var total int64
		if err := app.DB.Model(&models.Campus{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var campuses []models.Campus
		if err := app.DB.Order("id").Limit(limit).Offset(offset).Find(&campuses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedCampusesResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  campuses,
		})
	}
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
func CreateCampus(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.CreateCampusRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		campus := models.Campus{
			CampusName:  req.CampusName,
			CampusShort: req.CampusShort,
		}

		if err := app.DB.Create(&campus).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, campus)
	}
}
