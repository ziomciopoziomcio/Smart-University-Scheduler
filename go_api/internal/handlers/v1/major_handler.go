package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)


func GetMajors(c *gin.Context) {
	var majors []models.Major

	if err := db.DB.
		Preload("StudyField").
		Find(&majors).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": majors})
}


func CreateMajor(c *gin.Context) {
	var major models.Major

	if err := c.ShouldBindJSON(&major); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// StudyField exists?
	var studyField models.StudyField
	if err := db.DB.First(&studyField, *major.StudyFieldID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "study field not found",
		})
		return
	}


	if err := db.DB.Create(&major).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	db.DB.
		Preload("StudyField").
		First(&major, major.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data": major,
	})
}