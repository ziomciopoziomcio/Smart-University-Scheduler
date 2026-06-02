package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetStudyPrograms(c *gin.Context) {
	var studyPrograms []models.StudyProgram

	if err := db.DB.Find(&studyPrograms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": studyPrograms,
	})
}

func CreateStudyProgram(c *gin.Context) {
	var studyProgram models.StudyProgram

	if err := c.ShouldBindJSON(&studyProgram); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&studyProgram).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": studyProgram,
	})
}