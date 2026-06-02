package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)


func GetStudyFields(c *gin.Context) {
	var studyFields []models.StudyField

	if err := db.DB.
		Preload("Faculty").
		Find(&studyFields).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": studyFields,
	})
}

func CreateStudyField(c *gin.Context) {
	var studyField models.StudyField

	if err := c.ShouldBindJSON(&studyField); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// faculty exists?
	var faculty models.Faculty
	if err := db.DB.First(&faculty, studyField.FacultyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "faculty not found",
		})
		return
	}


	if err := db.DB.Create(&studyField).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.
		Preload("Faculty").
		First(&studyField, studyField.ID).Error; err != nil {

		c.JSON(http.StatusCreated, gin.H{
			"data": studyField,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": studyField,
	})
}