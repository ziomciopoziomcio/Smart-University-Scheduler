package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetCurriculumCourses godoc
// @Summary Get curriculum courses
// @Description Returns curriculum courses with course, major and elective block details (with aggregated group counts)
// @Tags curriculum-courses
// @Produce json
// @Success 200 {object} map[string][]dto.CurriculumCourseResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/curriculum-courses [get]
func GetCurriculumCourses(c *gin.Context) {
	var curriculumCourses []models.CurriculumCourse

	if err := db.DB.
		Preload("CourseRef").
		Preload("MajorRef").
		Preload("ElectiveBlockRef").
		Order("study_program, course, semester").
		Find(&curriculumCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	majorCounts := fetchMajorGroupCounts()
	items := mapToCurriculumResponses(curriculumCourses, majorCounts)

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}

func fetchMajorGroupCounts() map[int]int {
	type MajorCountRow struct {
		MajorID    int
		GroupCount int
	}
	var countRows []MajorCountRow
	db.DB.Table("groups").
		Select("major as major_id, count(id) as group_count").
		Where("major is not null").
		Group("major").
		Scan(&countRows)

	majorCounts := make(map[int]int)
	for _, row := range countRows {
		majorCounts[row.MajorID] = row.GroupCount
	}
	return majorCounts
}

func mapToCurriculumResponses(courses []models.CurriculumCourse, majorCounts map[int]int) []dto.CurriculumCourseResponse {
	items := make([]dto.CurriculumCourseResponse, 0, len(courses))

	for _, cc := range courses {
		var majorDetails *models.MajorReadResponse
		if cc.MajorRef != nil {
			majorDetails = &models.MajorReadResponse{
				ID:         cc.MajorRef.ID,
				StudyField: cc.MajorRef.StudyFieldID,
				MajorName:  cc.MajorRef.MajorName,
				GroupCount: majorCounts[cc.MajorRef.ID],
			}
		}

		items = append(items, dto.CurriculumCourseResponse{
			StudyProgram:  cc.StudyProgram,
			Course:        cc.Course,
			Semester:      cc.Semester,
			Major:         cc.Major,
			ElectiveBlock: cc.ElectiveBlock,
			CourseDetails: &dto.CourseDetails{
				CourseCode: cc.CourseRef.CourseCode,
				CourseName: cc.CourseRef.CourseName,
				ECTSPoints: cc.CourseRef.EctsPoints,
			},
			MajorDetails:         majorDetails,
			ElectiveBlockDetails: cc.ElectiveBlockRef,
		})
	}
	return items
}

// CreateCurriculumCourse godoc
// @Summary Create curriculum course
// @Description Creates a new curriculum course entry.
// @Tags curriculum-courses
// @Accept json
// @Produce json
// @Param request body dto.CreateCurriculumCourseRequest true "Curriculum course data"
// @Success 201 {object} models.CurriculumCourse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/curriculum-courses [post]
func CreateCurriculumCourse(c *gin.Context) {
	var req dto.CreateCurriculumCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	curriculumCourse := models.CurriculumCourse{
		StudyProgram:  req.StudyProgram,
		Course:        req.Course,
		Semester:      req.Semester,
		Major:         req.Major,
		ElectiveBlock: req.ElectiveBlock,
	}

	if err := db.DB.Create(&curriculumCourse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, curriculumCourse)
}