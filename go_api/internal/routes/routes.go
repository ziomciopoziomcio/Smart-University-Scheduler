package routes

import (
	"github.com/gin-gonic/gin"

	"go_api/internal/handlers"
	"go_api/internal/middleware"
)

func RegisterRoutes(r *gin.Engine) {

	// campuses
	r.GET("/campuses", handlers.GetCampuses)
	r.POST("/campuses", middleware.AdminOnly(), handlers.CreateCampus)

	// buildings
	r.GET("/buildings", handlers.GetBuildings)
	r.POST("/buildings", middleware.AdminOnly(), handlers.CreateBuilding)

	// rooms
	r.GET("/rooms", handlers.GetRooms)
	r.POST("/rooms", middleware.AdminOnly(), handlers.CreateRoom)

	// faculties
	r.GET("/faculties", handlers.GetFaculties)
	r.POST("/faculties", middleware.AdminOnly(), handlers.CreateFaculty)
}