package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetCourses(c *gin.Context) {
	var courses []models.Course

	if err := db.DB.Order("course_code").Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedCoursesResponse{
		Items: courses,
	})
}

func CreateCourse(c *gin.Context) {
	var req dto.CreateCourseRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course := models.Course{
		CourseCode:        req.CourseCode,
		EctsPoints:        req.EctsPoints,
		CourseName:        req.CourseName,
		CourseLanguage:    req.CourseLanguage,
		LeadingUnit:       req.LeadingUnit,
		CourseCoordinator: req.CourseCoordinator,
	}

	if err := db.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, course)
}