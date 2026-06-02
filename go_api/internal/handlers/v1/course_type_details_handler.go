package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetCourseTypeDetails(c *gin.Context) {
	var courseTypeDetails []models.CourseTypeDetail

	if err := db.DB.Find(&courseTypeDetails).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": courseTypeDetails,
	})
}

func CreateCourseTypeDetail(c *gin.Context) {
	var courseTypeDetail models.CourseTypeDetail

	if err := c.ShouldBindJSON(&courseTypeDetail); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&courseTypeDetail).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": courseTypeDetail,
	})
}