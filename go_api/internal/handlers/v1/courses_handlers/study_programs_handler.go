package courses_handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/models/courses_models"
)

// GetStudyPrograms godoc
// @Summary Get study programs
// @Description Returns study programs with semester statistics
// @Tags study-programs
// @Produce json
// @Success 200 {object} courses_models.PaginatedStudyProgramsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/study-programs [get]
func GetStudyPrograms(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var programs []courses_models.StudyProgram

		if err := app.DB.Order("id").Find(&programs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var mappedItems []courses_models.StudyProgramDetailResponse

		for _, p := range programs {
			semesterSummary, maxSem := fetchSemesterSummary(app, p.ID)

			mappedItems = append(mappedItems, courses_models.StudyProgramDetailResponse{
				ID:             p.ID,
				StudyField:     p.StudyField,
				StartYear:      p.StartYear,
				ProgramName:    p.ProgramName,
				SemestersCount: maxSem,
				SemesterSummary: semesterSummary,
			})
		}

		c.JSON(http.StatusOK, courses_models.PaginatedStudyProgramsResponse{
			Items: mappedItems,
		})
	}
}

// helper
func fetchSemesterSummary(app *app.App, programID int) ([]courses_models.SemesterSummary, int) {

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
	perSemMap := make(map[int]courses_models.SemesterSummary)

	for _, r := range rows {
		if r.Semester > maxSem {
			maxSem = r.Semester
		}

		perSemMap[r.Semester] = courses_models.SemesterSummary{
			SemesterNumber: r.Semester,
			CoursesCount:   r.CoursesCount,
			EctsSum:        r.EctsSum,
		}
	}

	var semesterSummary []courses_models.SemesterSummary

	for s := 1; s <= maxSem; s++ {
		if entry, ok := perSemMap[s]; ok {
			semesterSummary = append(semesterSummary, entry)
		} else {
			semesterSummary = append(semesterSummary, courses_models.SemesterSummary{
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

		if err := app.DB.Create(&studyProgram).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, studyProgram)
	}
}