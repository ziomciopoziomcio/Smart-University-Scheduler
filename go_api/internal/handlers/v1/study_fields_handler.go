package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

type CreateStudyFieldRequest struct {
	FieldName    string `json:"field_name" binding:"required"`
	FacultyShort string `json:"faculty_short" binding:"required"`
	Language     string `json:"language"`
	Mode         string `json:"mode"`
	Degree       string `json:"degree"`
}

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
	var req CreateStudyFieldRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	var faculty models.Faculty

	if err := db.DB.
		Where("faculty_short = ?", req.FacultyShort).
		First(&faculty).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "faculty not found",
		})
		return
	}

	studyField := models.StudyField{
		FieldName: req.FieldName,
		FacultyID: faculty.ID,
		Language:  req.Language,
		Mode:      req.Mode,
		Degree:    req.Degree,
	}

	if err := db.DB.Create(&studyField).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	db.DB.
		Preload("Faculty").
		First(&studyField, studyField.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data": studyField,
	})
}