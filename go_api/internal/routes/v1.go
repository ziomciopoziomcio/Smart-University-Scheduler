package routes

import (
	"github.com/gin-gonic/gin"

	"go_api/internal/app"

	"go_api/internal/handlers/v1/academics_handlers"
	"go_api/internal/handlers/v1/courses_handlers"
	"go_api/internal/handlers/v1/facilities_handlers"
	"go_api/internal/handlers/v1/users_handlers"
	"go_api/internal/middleware"

	_ "go_api/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func RegisterV1Routes(r *gin.Engine, app *app.App) {

	v1 := r.Group("/api/v1")

	v1.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// campuses
	v1.GET("/campuses", middleware.AdminOnly(app.DB), facilities_handlers.GetCampuses(app))
	v1.POST("/campuses", middleware.AdminOnly(app.DB), facilities_handlers.CreateCampus(app))

	// buildings
	v1.GET("/buildings", middleware.AdminOnly(app.DB), facilities_handlers.GetBuildings(app))
	v1.POST("/buildings", middleware.AdminOnly(app.DB), facilities_handlers.CreateBuilding(app))

	// rooms
	v1.GET("/rooms", middleware.AdminOnly(app.DB), facilities_handlers.GetRooms(app))
	v1.POST("/rooms", middleware.AdminOnly(app.DB), facilities_handlers.CreateRoom(app))

	// faculties
	v1.GET("/faculties", middleware.AdminOnly(app.DB), facilities_handlers.GetFaculties(app))
	v1.POST("/faculties", middleware.AdminOnly(app.DB), facilities_handlers.CreateFaculty(app))

	// units
	v1.GET("/units", middleware.AdminOnly(app.DB), academics_handlers.GetUnits(app))
	v1.POST("/units", middleware.AdminOnly(app.DB), academics_handlers.CreateUnit(app))

	// study fields
	v1.GET("/study-fields", middleware.AdminOnly(app.DB), courses_handlers.GetStudyFields(app))
	v1.POST("/study-fields", middleware.AdminOnly(app.DB), courses_handlers.CreateStudyField(app))

	// major
	v1.GET("/majors", middleware.AdminOnly(app.DB), courses_handlers.GetMajors(app))
	v1.POST("/majors", middleware.AdminOnly(app.DB), courses_handlers.CreateMajor(app))

	// elective block
	v1.GET("/elective-blocks", middleware.AdminOnly(app.DB), courses_handlers.GetElectiveBlocks(app))
	v1.POST("/elective-blocks", middleware.AdminOnly(app.DB), courses_handlers.CreateElectiveBlock(app))

	// study programs
	v1.GET("/study-programs", middleware.AdminOnly(app.DB), courses_handlers.GetStudyPrograms(app))
	v1.POST("/study-programs", middleware.AdminOnly(app.DB), courses_handlers.CreateStudyProgram(app))

	// courses
	v1.GET("/courses", middleware.AdminOnly(app.DB), courses_handlers.GetCourses(app))
	v1.POST("/courses", middleware.AdminOnly(app.DB), courses_handlers.CreateCourse(app))

	// curriculum courses
	v1.GET("/curriculum-courses", middleware.AdminOnly(app.DB), courses_handlers.GetCurriculumCourses(app))
	v1.POST("/curriculum-courses", middleware.AdminOnly(app.DB), courses_handlers.CreateCurriculumCourse(app))

	// course type details
	v1.GET("/course-type-details", middleware.AdminOnly(app.DB), courses_handlers.GetCourseTypeDetails(app))
	v1.POST("/course-type-details", middleware.AdminOnly(app.DB), courses_handlers.CreateCourseTypeDetail(app))

	// courses instructors
	v1.GET("/courses-instructors", middleware.AdminOnly(app.DB), courses_handlers.GetCoursesInstructors(app))
	v1.POST("/courses-instructors", middleware.AdminOnly(app.DB), courses_handlers.CreateCoursesInstructor(app))

	// groups
	v1.GET("/groups", middleware.AdminOnly(app.DB), academics_handlers.GetGroups(app))
	v1.POST("/groups", middleware.AdminOnly(app.DB), academics_handlers.CreateGroup(app))

	// group members
	v1.GET("/group-members", middleware.AdminOnly(app.DB), academics_handlers.GetGroupMembers(app))
	v1.POST("/group-members", middleware.AdminOnly(app.DB), academics_handlers.CreateGroupMember(app))

	// academic calendar
	v1.GET("/academic-calendar", middleware.AdminOnly(app.DB), academics_handlers.GetAcademicCalendar(app))
	v1.POST("/academic-calendar", middleware.AdminOnly(app.DB), academics_handlers.CreateAcademicCalendar(app))

	// students
	v1.POST("/users", middleware.AdminOnly(app.DB), users_handlers.CreateUserProxy())
	v1.DELETE("/users/:id", middleware.AdminOnly(app.DB), users_handlers.DeleteUserProxy())
	v1.GET("/users/:id", middleware.AdminOnly(app.DB), users_handlers.GetUserProxy(app))
	v1.GET("/users", middleware.AdminOnly(app.DB), users_handlers.GetUsers(app))

	// roles
	v1.GET("/roles", middleware.AdminOnly(app.DB), users_handlers.GetRoles(app))
	v1.POST("/roles", middleware.AdminOnly(app.DB), users_handlers.CreateRole(app))
	v1.POST("/roles/:id/permissions", middleware.AdminOnly(app.DB), users_handlers.AssignPermissionToRole(app))

	// permissions
	v1.GET("/permissions", middleware.AdminOnly(app.DB), users_handlers.GetPermissions(app))
	v1.POST("/permissions", middleware.AdminOnly(app.DB), users_handlers.CreatePermission(app))
}
