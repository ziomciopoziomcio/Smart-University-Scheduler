package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/models"
)

// GetStudyPrograms godoc
// @Summary Get study programs
// @Description Returns study programs with semester statistics
// @Tags study-programs
// @Produce json
// @Success 200 {object} models.PaginatedStudyProgramsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-programs [get]
func GetStudyPrograms(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var programs []models.StudyProgram

		if err := app.DB.Order("id").Find(&programs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var mappedItems []models.StudyProgramDetailResponse

		for _, p := range programs {
			semesterSummary, maxSem := fetchSemesterSummary(app, p.ID)

			mappedItems = append(mappedItems, models.StudyProgramDetailResponse{
				ID:             p.ID,
				StudyField:     p.StudyField,
				StartYear:      p.StartYear,
				ProgramName:    p.ProgramName,
				SemestersCount: maxSem,
				SemesterSummary: semesterSummary,
			})
		}

		c.JSON(http.StatusOK, models.PaginatedStudyProgramsResponse{
			Items: mappedItems,
		})
	}
}

// helper
func fetchSemesterSummary(app *app.App, programID int) ([]models.SemesterSummary, int) {

	type SummaryRow struct {
		Semester     int
		CoursesCount int
		EctsSum      int
	}

	var rows []SummaryRow

	app.DB.Table("curriculum_courses").
		Select(`
			curriculum_courses.semester as semester,
			count(curriculum_courses.course) as courses_count,
			coalesce(sum(courses.ects_points), 0) as ects_sum
		`).
		Joins("join courses on curriculum_courses.course = courses.course_code").
		Where("curriculum_courses.study_program = ?", programID).
		Group("curriculum_courses.semester").
		Order("curriculum_courses.semester").
		Scan(&rows)

	maxSem := 0
	perSemMap := make(map[int]models.SemesterSummary)

	for _, r := range rows {
		if r.Semester > maxSem {
			maxSem = r.Semester
		}

		perSemMap[r.Semester] = models.SemesterSummary{
			SemesterNumber: r.Semester,
			CoursesCount:   r.CoursesCount,
			EctsSum:        r.EctsSum,
		}
	}

	var semesterSummary []models.SemesterSummary

	for s := 1; s <= maxSem; s++ {
		if entry, ok := perSemMap[s]; ok {
			semesterSummary = append(semesterSummary, entry)
		} else {
			semesterSummary = append(semesterSummary, models.SemesterSummary{
				SemesterNumber: s,
				CoursesCount:   0,
				EctsSum:        0,
			})
		}
	}

	return semesterSummary, maxSem
}

// CreateStudyProgram godoc
// @Summary Create study program
// @Description Creates a new study program
// @Tags study-programs
// @Accept json
// @Produce json
// @Param request body models.StudyProgram true "Study program data"
// @Success 201 {object} models.StudyProgram
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-programs [post]
func CreateStudyProgram(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var studyProgram models.StudyProgram

		if err := c.ShouldBindJSON(&studyProgram); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := app.DB.Create(&studyProgram).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, studyProgram)
	}
}