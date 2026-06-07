package facilities_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/facilities_dto"
	"go_api/internal/models/facilities_models"
)

// GetFaculties godoc
// @Summary Get faculties
// @Description Returns paginated faculties with lecturers and students count
// @Tags faculties
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} facilities_models.PaginatedFacultiesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/faculties [get]
func GetFaculties(app *app.App) gin.HandlerFunc {
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
		if err := app.DB.Model(&facilities_models.Faculty{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var items []facilities_models.FacultyReadWithCounterResponse

		lecturersSubq := app.DB.Table("employees").
			Select("count(id)").
			Where("employees.faculty_id = faculties.id")

		studentsSubq := app.DB.Table("students").
			Joins("join study_programs on students.study_program = study_programs.id").
			Joins("join study_fields on study_programs.study_field = study_fields.id").
			Select("count(students.id)").
			Where("study_fields.faculty = faculties.id")

		err = app.DB.Table("faculties").
			Select(`
             faculties.id,
             faculties.faculty_name,
             faculties.faculty_short,
             coalesce((?), 0) as lecturers_count,
             coalesce((?), 0) as students_count
          `, lecturersSubq, studentsSubq).
			Order("faculties.id").
			Limit(limit).
			Offset(offset).
			Find(&items).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, facilities_models.PaginatedFacultiesResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateFaculty godoc
// @Summary Create faculty
// @Description Creates a new faculty.
// @Tags faculties
// @Accept json
// @Produce json
// @Param request body facilities_dto.CreateFacultyRequest true "Faculty data"
// @Success 201 {object} facilities_models.Faculty
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/faculties [post]
func CreateFaculty(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req facilities_dto.CreateFacultyRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		faculty := facilities_models.Faculty{
			FacultyName:  req.FacultyName,
			FacultyShort: req.FacultyShort,
		}

		if err := app.DB.Create(&faculty).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, faculty)
	}
}
