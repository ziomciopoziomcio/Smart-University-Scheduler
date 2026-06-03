package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

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

	// Szybkie pobranie liczby grup dla każdego majora
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

	items := make([]dto.CurriculumCourseResponse, 0, len(curriculumCourses))

	for _, cc := range curriculumCourses {
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

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}

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