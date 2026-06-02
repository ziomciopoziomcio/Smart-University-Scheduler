package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)


func GetElectiveBlocks(c *gin.Context) {
	var blocks []models.ElectiveBlock

	if err := db.DB.
		Preload("StudyField").
		Find(&blocks).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blocks})
}


func CreateElectiveBlock(c *gin.Context) {
	var block models.ElectiveBlock

	if err := c.ShouldBindJSON(&block); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// studyField exists?
	var studyField models.StudyField
	if err := db.DB.First(&studyField, block.StudyFieldID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "study field not found",
		})
		return
	}


	if err := db.DB.Create(&block).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	db.DB.
		Preload("StudyField").
		First(&block, block.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data": block,
	})
}