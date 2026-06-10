package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/models/courses_models"
	"go_api/internal/models/facilities_models"
)

// GetStudyFields godoc
// @Summary Get study fields
// @Description Returns paginated study fields with aggregated counts (majors, programs, elective blocks, semesters)
// @Tags study-fields
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedStudyFieldsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-fields [get]
func GetStudyFields(app *app.App) gin.HandlerFunc {
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

		items, total, err := app.Courses.GetStudyFields(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, courses_models.PaginatedStudyFieldsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateStudyField godoc
// @Summary Create study field
// @Description Creates a new study field.
// @Tags study-fields
// @Accept json
// @Produce json
// @Param request body courses_models.StudyField true "Study field data"
// @Success 201 {object} courses_models.StudyField
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-fields [post]
func CreateStudyField(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var studyField courses_models.StudyField

		if err := c.ShouldBindJSON(&studyField); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var faculty facilities_models.Faculty
		if err := app.DB.First(&faculty, studyField.FacultyID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "faculty not found"})
			return
		}

		if err := app.Courses.CreateStudyField(&studyField); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, studyField)
	}
}
