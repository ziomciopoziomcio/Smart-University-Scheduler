package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"go_api/internal/handlers/v1"
	"go_api/internal/middleware"

	swaggerFiles "github.com/swaggo/files"
    ginSwagger "github.com/swaggo/gin-swagger"
    _ "go_api/docs"
)

func RegisterV1Routes(r *gin.Engine, db *gorm.DB) {

	v1 := r.Group("/api/v1")

	v1.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// campuses
	v1.GET("/campuses", middleware.AdminOnly(db), handlers.GetCampuses)
	v1.POST("/campuses", middleware.AdminOnly(db), handlers.CreateCampus)

	// buildings
	v1.GET("/buildings", middleware.AdminOnly(db), handlers.GetBuildings)
	v1.POST("/buildings", middleware.AdminOnly(db), handlers.CreateBuilding)

	// rooms
	v1.GET("/rooms", middleware.AdminOnly(db), handlers.GetRooms)
	v1.POST("/rooms", middleware.AdminOnly(db), handlers.CreateRoom)

	// faculties
	v1.GET("/faculties", middleware.AdminOnly(db), handlers.GetFaculties)
	v1.POST("/faculties", middleware.AdminOnly(db), handlers.CreateFaculty)

	// units
	v1.GET("/units", middleware.AdminOnly(db), handlers.GetUnits)
	v1.POST("/units", middleware.AdminOnly(db), handlers.CreateUnit)

	// study fields
	v1.GET("/study-fields", middleware.AdminOnly(db), handlers.GetStudyFields)
    v1.POST("/study-fields", middleware.AdminOnly(db), handlers.CreateStudyField)

    // major
    v1.GET("/majors", middleware.AdminOnly(db), handlers.GetMajors)
	v1.POST("/majors", middleware.AdminOnly(db), handlers.CreateMajor)

    // elective block
    v1.GET("/elective-blocks", middleware.AdminOnly(db), middleware.AdminOnly(db), handlers.GetElectiveBlocks)
	v1.POST("/elective-blocks", middleware.AdminOnly(db), handlers.CreateElectiveBlock)

    // study programs
	v1.GET("/study-programs", middleware.AdminOnly(db), handlers.GetStudyPrograms)
	v1.POST("/study-programs", middleware.AdminOnly(db), handlers.CreateStudyProgram)

	// courses
	v1.GET("/courses", middleware.AdminOnly(db), handlers.GetCourses)
	v1.POST("/courses", middleware.AdminOnly(db), handlers.CreateCourse)

	// curriculum courses
	v1.GET("/curriculum-courses", middleware.AdminOnly(db), handlers.GetCurriculumCourses)
	v1.POST("/curriculum-courses", middleware.AdminOnly(db), handlers.CreateCurriculumCourse)

	// course type details
	v1.GET("/course-type-details", middleware.AdminOnly(db), handlers.GetCourseTypeDetails)
	v1.POST("/course-type-details", middleware.AdminOnly(db), handlers.CreateCourseTypeDetail)

	// courses instructors
	v1.GET("/courses-instructors", middleware.AdminOnly(db), handlers.GetCoursesInstructors)
	v1.POST("/courses-instructors", middleware.AdminOnly(db), handlers.CreateCoursesInstructor)

	// groups
	v1.GET("/groups", middleware.AdminOnly(db), handlers.GetGroups)
    v1.POST("/groups", middleware.AdminOnly(db), handlers.CreateGroup)

    // group members
    v1.GET("/group-members", middleware.AdminOnly(db), handlers.GetGroupMembers)
    v1.POST("/group-members", middleware.AdminOnly(db), handlers.CreateGroupMember)

    // academic calendar
    v1.GET("/academic-calendar", middleware.AdminOnly(db), handlers.GetAcademicCalendar)
    v1.POST("/academic-calendar", middleware.AdminOnly(db), handlers.CreateAcademicCalendar)

	// students
	v1.POST("/users", middleware.AdminOnly(db), handlers.CreateUserProxy)
    v1.DELETE("/users/:id", middleware.AdminOnly(db), handlers.DeleteUserProxy)
    v1.GET("/users/:id", middleware.AdminOnly(db), handlers.GetUserProxy)
    v1.GET("/users", middleware.AdminOnly(db), handlers.GetUsers)

    // roles
    v1.GET("/roles", middleware.AdminOnly(db), handlers.GetRoles)
    v1.POST("/roles", middleware.AdminOnly(db), handlers.CreateRole)
    v1.POST("/roles/:id/permissions", middleware.AdminOnly(db), handlers.AssignPermissionToRole)

    // permissions
    v1.GET("/permissions", middleware.AdminOnly(db), handlers.GetPermissions)
    v1.POST("/permissions", middleware.AdminOnly(db), handlers.CreatePermission)
}