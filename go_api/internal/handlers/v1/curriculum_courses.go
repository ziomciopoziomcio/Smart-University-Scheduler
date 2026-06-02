package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetCurriculumCourses(c *gin.Context) {
	var curriculumCourses []models.CurriculumCourse

	if err := db.DB.Find(&curriculumCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": curriculumCourses,
	})
}

func CreateCurriculumCourse(c *gin.Context) {
	var curriculumCourse models.CurriculumCourse

	if err := c.ShouldBindJSON(&curriculumCourse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&curriculumCourse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": curriculumCourse,
	})
}