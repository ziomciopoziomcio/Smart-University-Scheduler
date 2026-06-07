package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

// GetGroupMembers godoc
// @Summary Get group members
// @Description Returns list of group members with group relation
// @Tags group-members
// @Produce json
// @Success 200 {object} map[string][]models.GroupMember
// @Failure 500 {object} map[string]string
// @Router /api/v1/group-members [get]
func GetGroupMembers(c *gin.Context) {
	var members []models.GroupMember

	if err := db.DB.
		Preload("Group").
		Find(&members).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": members,
	})
}

// CreateGroupMember godoc
// @Summary Create group member
// @Description Adds a user to a group
// @Tags group-members
// @Accept json
// @Produce json
// @Param request body models.GroupMember true "Group member data"
// @Success 201 {object} map[string]models.GroupMember
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/group-members [post]
func CreateGroupMember(c *gin.Context) {
	var member models.GroupMember

	if err := c.ShouldBindJSON(&member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": member,
	})
}
