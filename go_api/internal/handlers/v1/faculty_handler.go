package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetFaculties godoc
// @Summary Get faculties
// @Description Returns faculties with lecturers and students count
// @Tags faculties
// @Produce json
// @Success 200 {object} models.PaginatedFacultiesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/faculties [get]
func GetFaculties(c *gin.Context) {
	var items []models.FacultyReadWithCounterResponse

	lecturersSubq := db.DB.Table("employees").
		Select("count(id)").
		Where("employees.faculty_id = faculties.id")

	studentsSubq := db.DB.Table("students").
		Joins("join study_programs on students.study_program = study_programs.id").
		Joins("join study_fields on study_programs.study_field = study_fields.id").
		Select("count(students.id)").
		Where("study_fields.faculty = faculties.id")

	err := db.DB.Table("faculties").
		Select(`
			faculties.id,
			faculties.faculty_name,
			faculties.faculty_short,
			coalesce((?), 0) as lecturers_count,
			coalesce((?), 0) as students_count
		`, lecturersSubq, studentsSubq).
		Order("faculties.id").
		Scan(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedFacultiesResponse{
		Items: items,
	})
}

// CreateFaculty godoc
// @Summary Create faculty
// @Description Creates a new faculty.
// @Tags faculties
// @Accept json
// @Produce json
// @Param request body dto.CreateFacultyRequest true "Faculty data"
// @Success 201 {object} models.Faculty
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/faculties [post]
func CreateFaculty(c *gin.Context) {
	var req dto.CreateFacultyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	faculty := models.Faculty{
		FacultyName:  req.FacultyName,
		FacultyShort: req.FacultyShort,
	}

	if err := db.DB.Create(&faculty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, faculty)
}
