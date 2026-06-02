package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetCoursesInstructors(c *gin.Context) {
	var coursesInstructors []models.CoursesInstructors

	if err := db.DB.Find(&coursesInstructors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": coursesInstructors,
	})
}

func CreateCoursesInstructor(c *gin.Context) {
	var coursesInstructor models.CoursesInstructors

	if err := c.ShouldBindJSON(&coursesInstructor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&coursesInstructor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": coursesInstructor,
	})
}