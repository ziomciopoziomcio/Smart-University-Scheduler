package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetBuildings godoc
// @Summary Get all buildings
// @Description Returns list of buildings with number of rooms
// @Tags buildings
// @Produce json
// @Success 200 {object} models.PaginatedBuildingsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/buildings [get]
func GetBuildings(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var items []models.BuildingReadResponse

		roomsSubq := app.DB.Table("rooms").
			Select("count(id)").
			Where("rooms.building_id = buildings.id")

		err := app.DB.Table("buildings").
			Select(`
				buildings.id,
				buildings.building_name,
				buildings.building_number,
				buildings.campus_id,
				coalesce((?), 0) as rooms_number
			`, roomsSubq).
			Order("buildings.id").
			Scan(&items).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedBuildingsResponse{
			Items: items,
		})
	}
}

// CreateBuilding godoc
// @Summary Create building
// @Description Creates a new building.
// @Tags buildings
// @Accept json
// @Produce json
// @Param request body dto.CreateBuildingRequest true "Building data"
// @Success 201 {object} models.Building
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/buildings [post]
func CreateBuilding(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var req dto.CreateBuildingRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var campus models.Campus
		if err := app.DB.First(&campus, req.CampusID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "campus not found"})
			return
		}

		building := models.Building{
			BuildingName:   req.BuildingName,
			BuildingNumber: req.BuildingNumber,
			CampusID:       req.CampusID,
		}

		if err := app.DB.Create(&building).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, building)
	}
}