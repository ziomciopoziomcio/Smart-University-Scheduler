package routes

import (
	"github.com/gin-gonic/gin"

	"go_api/internal/handlers/v1"
	"go_api/internal/middleware"
)

func RegisterV1Routes(r *gin.Engine) {

	v1 := r.Group("/api/v1")

	// campuses
	v1.GET("/campuses", handlers.GetCampuses)
	v1.POST("/campuses", middleware.AdminOnly(), handlers.CreateCampus)

	// buildings
	v1.GET("/buildings", handlers.GetBuildings)
	v1.POST("/buildings", middleware.AdminOnly(), handlers.CreateBuilding)

	// rooms
	v1.GET("/rooms", handlers.GetRooms)
	v1.POST("/rooms", middleware.AdminOnly(), handlers.CreateRoom)

	// faculties
	v1.GET("/faculties", handlers.GetFaculties)
	v1.POST("/faculties", middleware.AdminOnly(), handlers.CreateFaculty)
}