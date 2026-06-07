package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/courses_dto"
	"go_api/internal/models"
)

// GetElectiveBlocks godoc
// @Summary Get elective blocks
// @Description Returns paginated list of elective blocks
// @Tags elective-blocks
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedElectiveBlocksResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/elective-blocks [get]
func GetElectiveBlocks(app *app.App) gin.HandlerFunc {
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
		if err := app.DB.Model(&models.ElectiveBlock{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var blocks []models.ElectiveBlock

		if err := app.DB.
			Order("id").
			Limit(limit).
			Offset(offset).
			Find(&blocks).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedElectiveBlocksResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  blocks,
		})
	}
}

// CreateElectiveBlock godoc
// @Summary Create elective block
// @Description Creates a new elective block.
// @Tags elective-blocks
// @Accept json
// @Produce json
// @Param request body courses_dto.CreateElectiveBlockRequest true "Elective block data"
// @Success 201 {object} models.ElectiveBlock
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/elective-blocks [post]
func CreateElectiveBlock(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req courses_dto.CreateElectiveBlockRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var studyField models.StudyField
		if err := app.DB.First(&studyField, req.StudyField).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
			return
		}

		block := models.ElectiveBlock{
			StudyFieldID:      req.StudyField,
			ElectiveBlockName: req.ElectiveBlockName,
		}

		if err := app.DB.Create(&block).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, block)
	}
}
