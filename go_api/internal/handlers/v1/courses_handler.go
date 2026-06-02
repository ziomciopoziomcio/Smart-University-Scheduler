package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetCourses(c *gin.Context) {
	var courses []models.Course

	if err := db.DB.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": courses,
	})
}

type CreateCourseRequest struct {
    CourseCode        int    `json:"course_code"`
    EctsPoints        int    `json:"ects_points"`
    CourseName        string `json:"course_name"`
    CourseLanguage    string `json:"course_language"`
    LeadingUnit       int    `json:"leading_unit"`
    CourseCoordinator int    `json:"course_coordinator"`
}

func CreateCourse(c *gin.Context) {
    var req CreateCourseRequest

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

    c.JSON(http.StatusCreated, gin.H{"data": course})
}