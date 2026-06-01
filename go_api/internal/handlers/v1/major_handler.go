package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

type StudyFieldRefRequest struct {
	FieldName string `json:"field_name" binding:"required"`
	Degree    string `json:"degree" binding:"required"`
}

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

type CreateMajorRequest struct {
	StudyFieldRefRequest
	MajorName string `json:"major_name" binding:"required"`
}

func CreateMajor(c *gin.Context) {
	var req CreateMajorRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

    // find the study field based on the provided field name and degree
	var studyField models.StudyField
	if err := db.DB.
		Where("field_name = ? AND degree = ?", req.FieldName, req.Degree).
		First(&studyField).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
		return
	}

    // create major
	major := models.Major{
		MajorName:   req.MajorName,
		StudyFieldID: &studyField.ID,
	}

	if err := db.DB.Create(&major).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	db.DB.Preload("StudyField").First(&major, major.ID)

	c.JSON(http.StatusCreated, gin.H{"data": major})
}