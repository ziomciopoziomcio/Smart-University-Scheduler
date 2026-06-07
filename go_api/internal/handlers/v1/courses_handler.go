package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCourses godoc
// @Summary Get all courses
// @Description Returns list of all courses sorted by course code
// @Tags courses
// @Produce json
// @Success 200 {object} models.PaginatedCoursesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses [get]
func GetCourses(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var courses []models.Course

		if err := app.DB.Order("course_code").
			Find(&courses).Error; err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedCoursesResponse{
			Items: courses,
		})
	}
}

// CreateCourse godoc
// @Summary Create course
// @Description Creates a new course.
// @Tags courses
// @Accept json
// @Produce json
// @Param request body dto.CreateCourseRequest true "Course data"
// @Success 201 {object} models.Course
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses [post]
func CreateCourse(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

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

		if err := app.DB.Create(&course).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, course)
	}
}