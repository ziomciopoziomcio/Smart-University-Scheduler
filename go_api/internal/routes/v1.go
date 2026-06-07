package routes

import (
	"github.com/gin-gonic/gin"
	//"gorm.io/gorm"

	"go_api/internal/app"

	"go_api/internal/handlers/v1"
	"go_api/internal/middleware"

	_ "go_api/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func RegisterV1Routes(r *gin.Engine, app *app.App) {

	v1 := r.Group("/api/v1")

	v1.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// campuses
	v1.GET("/campuses", middleware.AdminOnly(app.DB), handlers.GetCampuses(app))
	v1.POST("/campuses", middleware.AdminOnly(app.DB), handlers.CreateCampus(app))

	// buildings
	v1.GET("/buildings", middleware.AdminOnly(app.DB), handlers.GetBuildings(app))
	v1.POST("/buildings", middleware.AdminOnly(app.DB), handlers.CreateBuilding(app))

	// rooms
	v1.GET("/rooms", middleware.AdminOnly(app.DB), handlers.GetRooms(app))
	v1.POST("/rooms", middleware.AdminOnly(app.DB), handlers.CreateRoom(app))

	// faculties
	v1.GET("/faculties", middleware.AdminOnly(app.DB), handlers.GetFaculties(app))
	v1.POST("/faculties", middleware.AdminOnly(app.DB), handlers.CreateFaculty(app))

	// units
	v1.GET("/units", middleware.AdminOnly(app.DB), handlers.GetUnits(app))
	v1.POST("/units", middleware.AdminOnly(app.DB), handlers.CreateUnit(app))

	// study fields
	v1.GET("/study-fields", middleware.AdminOnly(app.DB), handlers.GetStudyFields(app))
	v1.POST("/study-fields", middleware.AdminOnly(app.DB), handlers.CreateStudyField(app))

	// major
	v1.GET("/majors", middleware.AdminOnly(app.DB), handlers.GetMajors(app))
	v1.POST("/majors", middleware.AdminOnly(app.DB), handlers.CreateMajor(app))

	// elective block
	v1.GET("/elective-blocks", middleware.AdminOnly(app.DB), handlers.GetElectiveBlocks(app))
	v1.POST("/elective-blocks", middleware.AdminOnly(app.DB), handlers.CreateElectiveBlock(app))

	// study programs
	v1.GET("/study-programs", middleware.AdminOnly(app.DB), handlers.GetStudyPrograms(app))
	v1.POST("/study-programs", middleware.AdminOnly(app.DB), handlers.CreateStudyProgram(app))

	// courses
	v1.GET("/courses", middleware.AdminOnly(app.DB), handlers.GetCourses(app))
	v1.POST("/courses", middleware.AdminOnly(app.DB), handlers.CreateCourse(app))

	// curriculum courses
	v1.GET("/curriculum-courses", middleware.AdminOnly(app.DB), handlers.GetCurriculumCourses(app))
	v1.POST("/curriculum-courses", middleware.AdminOnly(app.DB), handlers.CreateCurriculumCourse(app))

	// course type details
	v1.GET("/course-type-details", middleware.AdminOnly(app.DB), handlers.GetCourseTypeDetails(app))
	v1.POST("/course-type-details", middleware.AdminOnly(app.DB), handlers.CreateCourseTypeDetail(app))

	// courses instructors
	v1.GET("/courses-instructors", middleware.AdminOnly(app.DB), handlers.GetCoursesInstructors(app))
	v1.POST("/courses-instructors", middleware.AdminOnly(app.DB), handlers.CreateCoursesInstructor(app))

	// groups
	v1.GET("/groups", middleware.AdminOnly(app.DB), handlers.GetGroups(app))
	v1.POST("/groups", middleware.AdminOnly(app.DB), handlers.CreateGroup(app))

	// group members
	v1.GET("/group-members", middleware.AdminOnly(app.DB), handlers.GetGroupMembers(app))
	v1.POST("/group-members", middleware.AdminOnly(app.DB), handlers.CreateGroupMember(app))

	// academic calendar
	v1.GET("/academic-calendar", middleware.AdminOnly(app.DB), handlers.GetAcademicCalendar(app))
	v1.POST("/academic-calendar", middleware.AdminOnly(app.DB), handlers.CreateAcademicCalendar(app))

	// students
	v1.POST("/users", middleware.AdminOnly(app.DB), handlers.CreateUserProxy())
	v1.DELETE("/users/:id", middleware.AdminOnly(app.DB), handlers.DeleteUserProxy())
	v1.GET("/users/:id", middleware.AdminOnly(app.DB), handlers.GetUserProxy(app))
	v1.GET("/users", middleware.AdminOnly(app.DB), handlers.GetUsers(app))

	// roles
	v1.GET("/roles", middleware.AdminOnly(app.DB), handlers.GetRoles(app))
	v1.POST("/roles", middleware.AdminOnly(app.DB), handlers.CreateRole(app))
	v1.POST("/roles/:id/permissions", middleware.AdminOnly(app.DB), handlers.AssignPermissionToRole(app))

	// permissions
	v1.GET("/permissions", middleware.AdminOnly(app.DB), handlers.GetPermissions(app))
	v1.POST("/permissions", middleware.AdminOnly(app.DB), handlers.CreatePermission(app))
}
