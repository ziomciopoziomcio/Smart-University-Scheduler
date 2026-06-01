package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

// type StudyFieldRefRequest struct {
// 	FieldName string `json:"field_name" binding:"required"`
// 	Degree    string `json:"degree" binding:"required"`
// }

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

type CreateElectiveBlockRequest struct {
	StudyFieldRefRequest
	ElectiveBlockName string `json:"elective_block_name" binding:"required"`
}

func CreateElectiveBlock(c *gin.Context) {
	var req CreateElectiveBlockRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

    // find the study field based on the provided field name and degree
	var studyField models.StudyField
	if err := db.DB.
		Where("field_name = ? AND degree = ?", req.FieldName, req.Degree).
		First(&studyField).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
		return
	}

    // create elective block
	block := models.ElectiveBlock{
		ElectiveBlockName: req.ElectiveBlockName,
		StudyFieldID:      studyField.ID,
	}

	if err := db.DB.Create(&block).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	db.DB.Preload("StudyField").First(&block, block.ID)

	c.JSON(http.StatusCreated, gin.H{"data": block})
}