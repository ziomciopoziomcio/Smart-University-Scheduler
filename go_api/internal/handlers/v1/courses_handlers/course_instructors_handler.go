package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/courses_dto"
	"go_api/internal/models/courses_models"
)

// GetCoursesInstructors godoc
// @Summary Get course instructors
// @Description Returns paginated list of course-instructor assignments
// @Tags courses-instructors
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedCoursesInstructorsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses-instructors [get]
func GetCoursesInstructors(app *app.App) gin.HandlerFunc {
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

		var total int64
		if err := app.DB.Model(&courses_models.CoursesInstructors{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var coursesInstructors []courses_models.CoursesInstructors

		if err := app.DB.Order("employee, course, class_type").
			Limit(limit).
			Offset(offset).
			Find(&coursesInstructors).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, courses_models.PaginatedCoursesInstructorsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  coursesInstructors,
		})
	}
}

// CreateCoursesInstructor godoc
// @Summary Assign instructor to course
// @Description Assigns an employee to a course and class type (after validating course type existence)
// @Tags courses-instructors
// @Accept json
// @Produce json
// @Param request body courses_dto.CreateCourseInstructorRequest true "Instructor assignment data"
// @Success 201 {object} courses_models.CoursesInstructors
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses-instructors [post]
func CreateCoursesInstructor(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req courses_dto.CreateCourseInstructorRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var ctd courses_models.CourseTypeDetail

		if err := app.DB.
			Where("course = ? AND class_type = ?", req.Course, req.ClassType).
			First(&ctd).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Cannot assign instructor: class type is not defined for this course",
			})
			return
		}

		coursesInstructor := courses_models.CoursesInstructors{
			Employee:  req.Employee,
			Course:    req.Course,
			ClassType: req.ClassType,
			Hours:     req.Hours,
		}

		if err := app.DB.Create(&coursesInstructor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, coursesInstructor)
	}
}
