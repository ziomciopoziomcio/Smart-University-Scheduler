package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetMajors godoc
// @Summary Get majors
// @Description Returns list of majors with group count
// @Tags majors
// @Produce json
// @Success 200 {object} models.PaginatedMajorsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/majors [get]
func GetMajors(c *gin.Context) {
	var items []models.MajorReadResponse

	err := db.DB.Table("major").
		Select(`
			major.id,
			major.study_field,
			major.major_name,
			coalesce(count(groups.id), 0) as group_count
		`).

		Joins("left join groups on groups.major = major.id").
		Group("major.id").
		Order("major.id").
		Scan(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedMajorsResponse{
		Items: items,
	})
}


// CreateMajor godoc
// @Summary Create major
// @Description Creates a new major.
// @Tags majors
// @Accept json
// @Produce json
// @Param request body dto.CreateMajorRequest true "Major data"
// @Success 201 {object} models.Major
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/majors [post]
func CreateMajor(c *gin.Context) {
	var req dto.CreateMajorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var studyField models.StudyField
	if err := db.DB.First(&studyField, *req.StudyField).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "study field not found"})
		return
	}

	major := models.Major{
		StudyFieldID: req.StudyField,
		MajorName:    req.MajorName,
	}

	if err := db.DB.Create(&major).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, major)
}