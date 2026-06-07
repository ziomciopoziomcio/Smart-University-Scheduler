package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetElectiveBlocks godoc
// @Summary Get elective blocks
// @Description Returns list of elective blocks
// @Tags elective-blocks
// @Produce json
// @Success 200 {object} models.PaginatedElectiveBlocksResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/elective-blocks [get]
func GetElectiveBlocks(c *gin.Context) {
	var blocks []models.ElectiveBlock

	if err := db.DB.Order("id").Find(&blocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedElectiveBlocksResponse{
		Items: blocks,
	})
}

// CreateElectiveBlock godoc
// @Summary Create elective block
// @Description Creates a new elective block.
// @Tags elective-blocks
// @Accept json
// @Produce json
// @Param request body dto.CreateElectiveBlockRequest true "Elective block data"
// @Success 201 {object} models.ElectiveBlock
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/elective-blocks [post]
func CreateElectiveBlock(c *gin.Context) {
	var req dto.CreateElectiveBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var studyField models.StudyField
	if err := db.DB.First(&studyField, req.StudyField).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
		return
	}

	block := models.ElectiveBlock{
		StudyFieldID:      req.StudyField,
		ElectiveBlockName: req.ElectiveBlockName,
	}

	if err := db.DB.Create(&block).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, block)
}
