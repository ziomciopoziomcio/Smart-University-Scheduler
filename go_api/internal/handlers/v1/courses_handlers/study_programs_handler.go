package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/models/courses_models"
)

// GetStudyPrograms godoc
// @Summary Get study programs
// @Description Returns paginated study programs with semester statistics
// @Tags study-programs
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedStudyProgramsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-programs [get]
func GetStudyPrograms(app *app.App) gin.HandlerFunc {
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

		programs, total, err := app.Courses.GetStudyPrograms(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var mappedItems []courses_models.StudyProgramDetailResponse

		for _, p := range programs {
			semesterSummary, maxSem := app.Courses.FetchSemesterSummary(p.ID)

			mappedItems = append(mappedItems, courses_models.StudyProgramDetailResponse{
				ID:              p.ID,
				StudyField:      p.StudyField,
				StartYear:       p.StartYear,
				ProgramName:     p.ProgramName,
				SemestersCount:  maxSem,
				SemesterSummary: semesterSummary,
			})
		}

		c.JSON(http.StatusOK, courses_models.PaginatedStudyProgramsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  mappedItems,
		})
	}
}

// CreateStudyProgram godoc
// @Summary Create study program
// @Description Creates a new study program
// @Tags study-programs
// @Accept json
// @Produce json
// @Param request body courses_models.StudyProgram true "Study program data"
// @Success 201 {object} courses_models.StudyProgram
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-programs [post]
func CreateStudyProgram(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var studyProgram courses_models.StudyProgram

		if err := c.ShouldBindJSON(&studyProgram); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := app.Courses.CreateStudyProgram(&studyProgram); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, studyProgram)
	}
}
