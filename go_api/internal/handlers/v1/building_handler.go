package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetBuildings(c *gin.Context) {
	var items []models.BuildingReadResponse

	roomsSubq := db.DB.Table("rooms").
		Select("count(id)").
		Where("rooms.building_id = buildings.id")

	err := db.DB.Table("buildings").
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

func CreateBuilding(c *gin.Context) {
	var req dto.CreateBuildingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var campus models.Campus
	if err := db.DB.First(&campus, req.CampusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "campus not found"})
		return
	}

	building := models.Building{
		BuildingName:   req.BuildingName,
		BuildingNumber: req.BuildingNumber,
		CampusID:       req.CampusID,
	}

	if err := db.DB.Create(&building).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, building)
}