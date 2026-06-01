package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)


type CreateUnitRequest struct {
	UnitName    string `json:"unit_name" binding:"required"`
	UnitShort   string `json:"unit_short" binding:"required"`
	FacultyShort string `json:"faculty_short" binding:"required"`
}

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
	var req CreateUnitRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

    // find faculty
	var faculty models.Faculty
	if err := db.DB.
		Where("faculty_short  = ?", req.FacultyShort).
		First(&faculty).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "faculty not found",
		})
		return
	}

    // create unit
	unit := models.Unit{
		UnitName:  req.UnitName,
		UnitShort: req.UnitShort,
		FacultyID: faculty.ID,
	}

    // add unit
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
