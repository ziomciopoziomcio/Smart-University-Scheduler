package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)


// GetCourseTypeDetails godoc
// @Summary Get course type details
// @Description Returns list of course type details sorted by course and class type
// @Tags course-type-details
// @Produce json
// @Success 200 {object} models.PaginatedCourseTypeDetailsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/course-type-details [get]
func GetCourseTypeDetails(c *gin.Context) {
	var courseTypeDetails []models.CourseTypeDetail

	if err := db.DB.Order("course, class_type").Find(&courseTypeDetails).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedCourseTypeDetailsResponse{
		Items: courseTypeDetails,
	})
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
func CreateCourseTypeDetail(c *gin.Context) {
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

	if err := db.DB.Create(&courseTypeDetail).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, courseTypeDetail)
}