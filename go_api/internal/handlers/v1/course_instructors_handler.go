package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCoursesInstructors godoc
// @Summary Get course instructors
// @Description Returns list of course-instructor assignments
// @Tags courses-instructors
// @Produce json
// @Success 200 {object} models.PaginatedCoursesInstructorsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses-instructors [get]
func GetCoursesInstructors(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var coursesInstructors []models.CoursesInstructors

		if err := app.DB.Order("employee, course, class_type").
			Find(&coursesInstructors).Error; err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedCoursesInstructorsResponse{
			Items: coursesInstructors,
		})
	}
}

// CreateCoursesInstructor godoc
// @Summary Assign instructor to course
// @Description Assigns an employee to a course and class type (after validating course type existence)
// @Tags courses-instructors
// @Accept json
// @Produce json
// @Param request body dto.CreateCourseInstructorRequest true "Instructor assignment data"
// @Success 201 {object} models.CoursesInstructors
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/courses-instructors [post]
func CreateCoursesInstructor(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var req dto.CreateCourseInstructorRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var ctd models.CourseTypeDetail

		if err := app.DB.
			Where("course = ? AND class_type = ?", req.Course, req.ClassType).
			First(&ctd).Error; err != nil {

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

		if err := app.DB.Create(&coursesInstructor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, coursesInstructor)
	}
}