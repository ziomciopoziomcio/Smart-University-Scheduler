package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/models"
	"go_api/internal/dto"
)

func GetCurriculumCourses(c *gin.Context) {
	var curriculumCourses []models.CurriculumCourse

	if err := db.DB.
		Preload("CourseRef").
		Preload("MajorRef").
		Preload("ElectiveBlockRef").
		Find(&curriculumCourses).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}


	items := make([]dto.CurriculumCourseResponse, 0, len(curriculumCourses))

    for _, cc := range curriculumCourses {
        items = append(items, dto.CurriculumCourseResponse{
            StudyProgram: cc.StudyProgram,
            Course:       cc.Course,
            Semester:     cc.Semester,
            Major:        cc.Major,
            ElectiveBlock: cc.ElectiveBlock,

            CourseDetails: &dto.CourseDetails{
                CourseCode: cc.CourseRef.CourseCode,
                CourseName: cc.CourseRef.CourseName,
                 ECTSPoints: cc.CourseRef.EctsPoints,
            },

            MajorDetails:         cc.MajorRef,
            ElectiveBlockDetails: cc.ElectiveBlockRef,
        })
    }
	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": len(items),
	})
}

func CreateCurriculumCourse(c *gin.Context) {
	var curriculumCourse models.CurriculumCourse

	if err := c.ShouldBindJSON(&curriculumCourse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := db.DB.Create(&curriculumCourse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": curriculumCourse,
	})
}