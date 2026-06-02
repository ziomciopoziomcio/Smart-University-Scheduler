package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"go_api/internal/handlers/v1"
	"go_api/internal/middleware"
)

func RegisterV1Routes(r *gin.Engine, db *gorm.DB) {

	v1 := r.Group("/api/v1")

	// campuses
	v1.GET("/campuses", handlers.GetCampuses)
	v1.POST("/campuses", middleware.AdminOnly(db), handlers.CreateCampus)

	// buildings
	v1.GET("/buildings", handlers.GetBuildings)
	v1.POST("/buildings", middleware.AdminOnly(db), handlers.CreateBuilding)

	// rooms
	v1.GET("/rooms", handlers.GetRooms)
	v1.POST("/rooms", middleware.AdminOnly(db), handlers.CreateRoom)

	// faculties
	v1.GET("/faculties", handlers.GetFaculties)
	v1.POST("/faculties", middleware.AdminOnly(db), handlers.CreateFaculty)

	// units
	v1.GET("/units", handlers.GetUnits)
	v1.POST("/units", handlers.CreateUnit)

	// study fields
	v1.GET("/study-fields", handlers.GetStudyFields)
    v1.POST("/study-fields", handlers.CreateStudyField)

    // major
    v1.GET("/majors", handlers.GetMajors)
	v1.POST("/majors", handlers.CreateMajor)

    // elective block
    v1.GET("/elective-blocks", handlers.GetElectiveBlocks)
	v1.POST("/elective-blocks", handlers.CreateElectiveBlock)

    // study programs
	v1.GET("/study-programs", handlers.GetStudyPrograms)
	v1.POST("/study-programs", handlers.CreateStudyProgram)

	// courses
	v1.GET("/courses", handlers.GetCourses)
	v1.POST("/courses", handlers.CreateCourse)

	// curriculum courses
	v1.GET("/curriculum-courses", handlers.GetCurriculumCourses)
	v1.POST("/curriculum-courses", handlers.CreateCurriculumCourse)

	// course type details
	v1.GET("/course-type-details", handlers.GetCourseTypeDetails)
	v1.POST("/course-type-details", handlers.CreateCourseTypeDetail)

	// courses instructors
	v1.GET("/courses-instructors", handlers.GetCoursesInstructors)
	v1.POST("/courses-instructors", handlers.CreateCoursesInstructor)

	// groups
	v1.GET("/groups", handlers.GetGroups)
    v1.POST("/groups", handlers.CreateGroup)

    // group members
    v1.GET("/group-members", handlers.GetGroupMembers)
    v1.POST("/group-members", handlers.CreateGroupMember)

    // academic calendar
    v1.GET("/academic-calendar", handlers.GetAcademicCalendar)
    v1.POST("/academic-calendar", handlers.CreateAcademicCalendar)

	// students
	v1.POST("/users", middleware.AdminOnly(db), handlers.CreateUserProxy)
    v1.DELETE("/users/:id", middleware.AdminOnly(db), handlers.DeleteUserProxy)
    v1.GET("/users/:id", middleware.AdminOnly(db), handlers.GetUserProxy)
}