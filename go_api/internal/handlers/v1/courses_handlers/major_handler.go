package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/courses_dto"
	"go_api/internal/models/courses_models"
)

// GetMajors godoc
// @Summary Get majors
// @Description Returns paginated list of majors with group count
// @Tags majors
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedMajorsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/majors [get]
func GetMajors(app *app.App) gin.HandlerFunc {
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

		items, total, err := app.Courses.GetMajors(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, courses_models.PaginatedMajorsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateMajor godoc
// @Summary Create major
// @Description Creates a new major.
// @Tags majors
// @Accept json
// @Produce json
// @Param request body courses_dto.CreateMajorRequest true "Major data"
// @Success 201 {object} courses_models.Major
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/majors [post]
func CreateMajor(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req courses_dto.CreateMajorRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.StudyField == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "study_field is required"})
			return
		}

		var studyField courses_models.StudyField
		if err := app.DB.First(&studyField, *req.StudyField).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
			return
		}

		major := courses_models.Major{
			StudyFieldID: req.StudyField,
			MajorName:    req.MajorName,
		}

		if err := app.Courses.CreateMajor(&major); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, major)
	}
}
