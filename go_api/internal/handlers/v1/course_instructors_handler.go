package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetCoursesInstructors(c *gin.Context) {
	var coursesInstructors []models.CoursesInstructors

	if err := db.DB.Order("employee, course, class_type").Find(&coursesInstructors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedCoursesInstructorsResponse{
		Items: coursesInstructors,
	})
}

func CreateCoursesInstructor(c *gin.Context) {
	var req dto.CreateCourseInstructorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ctd models.CourseTypeDetail
	if err := db.DB.Where("course = ? AND class_type = ?", req.Course, req.ClassType).First(&ctd).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot assign instructor: class type is not defined for this course",
		})
		return
	}

	coursesInstructor := models.CoursesInstructors{
		Employee:  req.Employee,
		Course:    req.Course,
		ClassType: req.ClassType,
		Hours:     req.Hours,
	}

	if err := db.DB.Create(&coursesInstructor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, coursesInstructor)
}