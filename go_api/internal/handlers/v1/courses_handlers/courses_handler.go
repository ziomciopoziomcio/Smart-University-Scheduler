package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/courses_dto"
	"go_api/internal/models/courses_models"
)

// GetCourses godoc
// @Summary Get all courses
// @Description Returns paginated list of all courses sorted by course code
// @Tags courses
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedCoursesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses [get]
func GetCourses(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		courses, total, err := app.Courses.GetCourses(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, courses_models.PaginatedCoursesResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  courses,
		})
	}
}

// CreateCourse godoc
// @Summary Create course
// @Description Creates a new course.
// @Tags courses
// @Accept json
// @Produce json
// @Param request body courses_dto.CreateCourseRequest true "Course data"
// @Success 201 {object} courses_models.Course
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses [post]
func CreateCourse(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req courses_dto.CreateCourseRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		course := courses_models.Course{
			CourseCode:        req.CourseCode,
			EctsPoints:        req.EctsPoints,
			CourseName:        req.CourseName,
			CourseLanguage:    req.CourseLanguage,
			LeadingUnit:       req.LeadingUnit,
			CourseCoordinator: req.CourseCoordinator,
		}

		if err := app.Courses.CreateCourse(&course); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, course)
	}
}
