package courses_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/courses_dto"
	"go_api/internal/models/courses_models"
)

// GetCurriculumCourses godoc
// @Summary Get curriculum courses
// @Description Returns paginated curriculum courses with course, major and elective block details (with aggregated group counts)
// @Tags curriculum-courses
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} courses_models.PaginatedCurriculumCoursesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/curriculum-courses [get]
func GetCurriculumCourses(app *app.App) gin.HandlerFunc {
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

		curriculumCourses, total, err := app.Courses.GetCurriculumCourses(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		majorCounts := app.Courses.FetchMajorGroupCounts()
		items := mapToCurriculumResponses(curriculumCourses, majorCounts)

		c.JSON(http.StatusOK, gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"items":  items,
		})
	}
}

func mapToCurriculumResponses(
	courses []courses_models.CurriculumCourse,
	majorCounts map[int]int,
) []courses_dto.CurriculumCourseResponse {

	items := make([]courses_dto.CurriculumCourseResponse, 0, len(courses))

	for _, cc := range courses {
		var majorDetails *courses_models.MajorReadResponse

		if cc.MajorRef != nil {
			majorDetails = &courses_models.MajorReadResponse{
				ID:         cc.MajorRef.ID,
				StudyField: cc.MajorRef.StudyFieldID,
				MajorName:  cc.MajorRef.MajorName,
				GroupCount: majorCounts[cc.MajorRef.ID],
			}
		}

		items = append(items, courses_dto.CurriculumCourseResponse{
			StudyProgram:  cc.StudyProgram,
			Course:        cc.Course,
			Semester:      cc.Semester,
			Major:         cc.Major,
			ElectiveBlock: cc.ElectiveBlock,
			CourseDetails: &courses_dto.CourseDetails{
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
// @Param request body courses_dto.CreateCurriculumCourseRequest true "Curriculum course data"
// @Success 201 {object} courses_models.CurriculumCourse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/curriculum-courses [post]
func CreateCurriculumCourse(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req courses_dto.CreateCurriculumCourseRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		curriculumCourse := courses_models.CurriculumCourse{
			StudyProgram:  req.StudyProgram,
			Course:        req.Course,
			Semester:      req.Semester,
			Major:         req.Major,
			ElectiveBlock: req.ElectiveBlock,
		}

		if err := app.Courses.CreateCurriculumCourse(&curriculumCourse); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, curriculumCourse)
	}
}
