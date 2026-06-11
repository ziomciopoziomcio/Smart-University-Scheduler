package facilities_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/facilities_dto"
	"go_api/internal/models/facilities_models"
)

// GetBuildings godoc
// @Summary Get all buildings
// @Description Returns paginated list of buildings with number of rooms
// @Tags buildings
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} facilities_models.PaginatedBuildingsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/buildings [get]
func GetBuildings(app *app.App) gin.HandlerFunc {
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

		items, total, err := app.Facilities.GetBuildings(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, facilities_models.PaginatedBuildingsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateBuilding godoc
// @Summary Create building
// @Description Creates a new building.
// @Tags buildings
// @Accept json
// @Produce json
// @Param request body facilities_dto.CreateBuildingRequest true "Building data"
// @Success 201 {object} facilities_models.Building
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/buildings [post]
func CreateBuilding(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req facilities_dto.CreateBuildingRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var campus facilities_models.Campus
		if err := app.DB.First(&campus, req.CampusID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "campus not found"})
			return
		}

		building := facilities_models.Building{
			BuildingName:   req.BuildingName,
			BuildingNumber: req.BuildingNumber,
			CampusID:       req.CampusID,
		}

		if err := app.Facilities.CreateBuilding(&building); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, building)
	}
}
