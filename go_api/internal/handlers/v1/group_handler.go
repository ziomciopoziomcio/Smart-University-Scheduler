package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
	"go_api/internal/dto"
)

// GetGroups godoc
// @Summary Get all groups
// @Description Returns list of all groups
// @Tags groups
// @Produce json
// @Success 200 {object} map[string][]dto.GroupResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/groups [get]
func GetGroups(c *gin.Context) {
	var groups []models.Group

	if err := db.DB.Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	items := make([]dto.GroupResponse, 0, len(groups))

	for _, g := range groups {
		items = append(items, dto.GroupResponse{
			ID:            g.ID,
			GroupName:     g.GroupName,
			StudyProgram:  g.StudyProgram,
			Major:         g.Major,
			ElectiveBlock: g.ElectiveBlock,
			Semester:      g.Semester,
			IsActive:      g.IsActive,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
	})
}


// CreateGroup godoc
// @Summary Create group
// @Description Creates a new group.
// @Tags groups
// @Accept json
// @Produce json
// @Param request body models.Group true "Group data"
// @Success 201 {object} map[string]models.Group
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/groups [post]
func CreateGroup(c *gin.Context) {
	var group models.Group

	if err := c.ShouldBindJSON(&group); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": group,
	})
}