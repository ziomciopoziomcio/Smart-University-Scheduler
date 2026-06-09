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
    v1.GET("/campuses", middleware.ApiKeyAdminOnly(app), facilities_handlers.GetCampuses(app))
    v1.POST("/campuses", middleware.ApiKeyAdminOnly(app), facilities_handlers.CreateCampus(app))

    // buildings
    v1.GET("/buildings", middleware.ApiKeyAdminOnly(app), facilities_handlers.GetBuildings(app))
    v1.POST("/buildings", middleware.ApiKeyAdminOnly(app), facilities_handlers.CreateBuilding(app))

    // rooms
    v1.GET("/rooms", middleware.ApiKeyAdminOnly(app), facilities_handlers.GetRooms(app))
    v1.POST("/rooms", middleware.ApiKeyAdminOnly(app), facilities_handlers.CreateRoom(app))

    // faculties
    v1.GET("/faculties", middleware.ApiKeyAdminOnly(app), facilities_handlers.GetFaculties(app))
    v1.POST("/faculties", middleware.ApiKeyAdminOnly(app), facilities_handlers.CreateFaculty(app))

    // units
    v1.GET("/units", middleware.ApiKeyAdminOnly(app), academics_handlers.GetUnits(app))
    v1.POST("/units", middleware.ApiKeyAdminOnly(app), academics_handlers.CreateUnit(app))

    // study fields
    v1.GET("/study-fields", middleware.ApiKeyAdminOnly(app), courses_handlers.GetStudyFields(app))
    v1.POST("/study-fields", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateStudyField(app))

    // major
    v1.GET("/majors", middleware.ApiKeyAdminOnly(app), courses_handlers.GetMajors(app))
    v1.POST("/majors", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateMajor(app))

    // elective block
    v1.GET("/elective-blocks", middleware.ApiKeyAdminOnly(app), courses_handlers.GetElectiveBlocks(app))
    v1.POST("/elective-blocks", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateElectiveBlock(app))

    // study programs
    v1.GET("/study-programs", middleware.ApiKeyAdminOnly(app), courses_handlers.GetStudyPrograms(app))
    v1.POST("/study-programs", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateStudyProgram(app))

    // courses
    v1.GET("/courses", middleware.ApiKeyAdminOnly(app), courses_handlers.GetCourses(app))
    v1.POST("/courses", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateCourse(app))

    // curriculum courses
    v1.GET("/curriculum-courses", middleware.ApiKeyAdminOnly(app), courses_handlers.GetCurriculumCourses(app))
    v1.POST("/curriculum-courses", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateCurriculumCourse(app))

    // course type details
    v1.GET("/course-type-details", middleware.ApiKeyAdminOnly(app), courses_handlers.GetCourseTypeDetails(app))
    v1.POST("/course-type-details", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateCourseTypeDetail(app))

    // courses instructors
    v1.GET("/courses-instructors", middleware.ApiKeyAdminOnly(app), courses_handlers.GetCoursesInstructors(app))
    v1.POST("/courses-instructors", middleware.ApiKeyAdminOnly(app), courses_handlers.CreateCoursesInstructor(app))

    // groups
    v1.GET("/groups", middleware.ApiKeyAdminOnly(app), academics_handlers.GetGroups(app))
    v1.POST("/groups", middleware.ApiKeyAdminOnly(app), academics_handlers.CreateGroup(app))

    // group members
    v1.GET("/group-members", middleware.ApiKeyAdminOnly(app), academics_handlers.GetGroupMembers(app))
    v1.POST("/group-members", middleware.ApiKeyAdminOnly(app), academics_handlers.CreateGroupMember(app))

    // academic calendar
    v1.GET("/academic-calendar", middleware.ApiKeyAdminOnly(app), academics_handlers.GetAcademicCalendar(app))
    v1.POST("/academic-calendar", middleware.ApiKeyAdminOnly(app), academics_handlers.CreateAcademicCalendar(app))

    // students
    v1.POST("/users", middleware.ApiKeyAdminOnly(app), users_handlers.CreateUserProxy())
    v1.DELETE("/users/:id", middleware.ApiKeyAdminOnly(app), users_handlers.DeleteUserProxy())
    v1.GET("/users/:id", middleware.ApiKeyAdminOnly(app), users_handlers.GetUserProxy(app))
    v1.GET("/users", middleware.ApiKeyAdminOnly(app), users_handlers.GetUsers(app))

    // roles
    v1.GET("/roles", middleware.ApiKeyAdminOnly(app), users_handlers.GetRoles(app))
    v1.POST("/roles", middleware.ApiKeyAdminOnly(app), users_handlers.CreateRole(app))
    v1.POST("/roles/:id/permissions", middleware.ApiKeyAdminOnly(app), users_handlers.AssignPermissionToRole(app))

    // permissions
    v1.GET("/permissions", middleware.ApiKeyAdminOnly(app), users_handlers.GetPermissions(app))
    v1.POST("/permissions", middleware.ApiKeyAdminOnly(app), users_handlers.CreatePermission(app))
}