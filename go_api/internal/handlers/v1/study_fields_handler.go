package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

// GetStudyFields godoc
// @Summary Get study fields
// @Description Returns study fields with aggregated counts (majors, programs, elective blocks, semesters)
// @Tags study-fields
// @Produce json
// @Success 200 {object} models.PaginatedStudyFieldsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-fields [get]
func GetStudyFields(c *gin.Context) {
	var items []models.StudyFieldListSummaryResponse

	electiveBlocksSubq := db.DB.Table("elective_block").
		Select("count(id)").
		Where("elective_block.study_field = study_fields.id")

	programsSubq := db.DB.Table("study_programs").
		Select("count(id)").
		Where("study_programs.study_field = study_fields.id")

	err := db.DB.Table("study_fields").
		Select(`
			study_fields.id,
			study_fields.faculty as faculty,
			study_fields.field_name,
			study_fields.language,
			study_fields.mode,
			study_fields.degree,
			coalesce(count(distinct major.id), 0) as specializations_count,
			coalesce(max(curriculum_courses.semester), 0) as semesters_count,
			coalesce((?), 0) as elective_blocks_count,
			coalesce((?), 0) as programs_count
		`, electiveBlocksSubq, programsSubq).
		Joins("left join major on study_fields.id = major.study_field").
		Joins("left join study_programs on study_fields.id = study_programs.study_field").
		Joins("left join curriculum_courses on study_programs.id = curriculum_courses.study_program").
		Group("study_fields.id").
		Order("study_fields.id").
		Scan(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedStudyFieldsResponse{
		Items: items,
	})
}

// CreateStudyField godoc
// @Summary Create study field
// @Description Creates a new study field.
// @Tags study-fields
// @Accept json
// @Produce json
// @Param request body models.StudyField true "Study field data"
// @Success 201 {object} models.StudyField
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-fields [post]
func CreateStudyField(c *gin.Context) {
	var studyField models.StudyField

	if err := c.ShouldBindJSON(&studyField); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var faculty models.Faculty
	if err := db.DB.First(&faculty, studyField.FacultyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "faculty not found"})
		return
	}

	if err := db.DB.Create(&studyField).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, studyField)
}
