package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetCourseTypeDetails(c *gin.Context) {
	var courseTypeDetails []models.CourseTypeDetail

	if err := db.DB.Order("course, class_type").Find(&courseTypeDetails).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedCourseTypeDetailsResponse{
		Items: courseTypeDetails,
	})
}

func CreateCourseTypeDetail(c *gin.Context) {
	var req dto.CreateCourseTypeDetailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	courseTypeDetail := models.CourseTypeDetail{
		Course:                     req.Course,
		ClassType:                  req.ClassType,
		ClassHours:                 req.ClassHours,
		SlotsPerClass:              req.SlotsPerClass,
		Frequency:                  req.Frequency,
		ManualWeeks:                req.ManualWeeks,
		PCNeeded:                   req.PCNeeded,
		ProjectorNeeded:            req.ProjectorNeeded,
		MaxGroupParticipantsNumber: req.MaxGroupParticipantsNumber,
	}

	if err := db.DB.Create(&courseTypeDetail).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, courseTypeDetail)
}