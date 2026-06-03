package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
)

func GetStudyPrograms(c *gin.Context) {
	var programs []models.StudyProgram

	if err := db.DB.Order("id").Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var mappedItems []models.StudyProgramDetailResponse

	for _, p := range programs {
		type SummaryRow struct {
			Semester     int
			CoursesCount int
			EctsSum      int
		}
		var rows []SummaryRow

		db.DB.Table("curriculum_courses").
			Select(`
				curriculum_courses.semester as semester,
				count(curriculum_courses.course) as courses_count,
				coalesce(sum(courses.ects_points), 0) as ects_sum
			`).
			Joins("join courses on curriculum_courses.course = courses.course_code").
			Where("curriculum_courses.study_program = ?", p.ID).
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
			if entry, exists := perSemMap[s]; exists {
				semesterSummary = append(semesterSummary, entry)
			} else {
				semesterSummary = append(semesterSummary, models.SemesterSummary{
					SemesterNumber: s,
					CoursesCount:   0,
					EctsSum:        0,
				})
			}
		}

		mappedItems = append(mappedItems, models.StudyProgramDetailResponse{
			ID:              p.ID,
			StudyField:      p.StudyField,
			StartYear:       p.StartYear,
			ProgramName:     p.ProgramName,
			SemestersCount:  maxSem,
			SemesterSummary: semesterSummary,
		})
	}

	c.JSON(http.StatusOK, models.PaginatedStudyProgramsResponse{
		Items: mappedItems,
	})
}

func CreateStudyProgram(c *gin.Context) {
	var studyProgram models.StudyProgram

	if err := c.ShouldBindJSON(&studyProgram); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&studyProgram).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, studyProgram)
}