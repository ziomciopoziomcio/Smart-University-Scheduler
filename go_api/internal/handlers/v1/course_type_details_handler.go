package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCourseTypeDetails godoc
// @Summary Get course type details
// @Description Returns paginated list of course type details sorted by course and class type
// @Tags course-type-details
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedCourseTypeDetailsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/course-type-details [get]
func GetCourseTypeDetails(app *app.App) gin.HandlerFunc {
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
		if err := app.DB.Model(&models.CourseTypeDetail{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var courseTypeDetails []models.CourseTypeDetail

		if err := app.DB.
			Order("course, class_type").
			Limit(limit).
			Offset(offset).
			Find(&courseTypeDetails).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedCourseTypeDetailsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  courseTypeDetails,
		})
	}
}

// CreateCourseTypeDetail godoc
// @Summary Create course type detail
// @Description Creates a new course type detail entry.
// @Tags course-type-details
// @Accept json
// @Produce json
// @Param request body dto.CreateCourseTypeDetailRequest true "Course type detail data"
// @Success 201 {object} models.CourseTypeDetail
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/course-type-details [post]
func CreateCourseTypeDetail(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		if err := app.DB.Create(&courseTypeDetail).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, courseTypeDetail)
	}
}
