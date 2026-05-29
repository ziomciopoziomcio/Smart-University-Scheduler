package routes

import (
	"github.com/gin-gonic/gin"

	"go_api/internal/handlers"
)

func RegisterRoutes(r *gin.Engine) {

	// campuses
	r.GET("/campuses", handlers.GetCampuses)
	r.POST("/campuses", handlers.CreateCampus)

	// buildings
	r.GET("/buildings", handlers.GetBuildings)
	r.POST("/buildings", handlers.CreateBuilding)

	// rooms
	r.GET("/rooms", handlers.GetRooms)
	r.POST("/rooms", handlers.CreateRoom)

	// faculties
	r.GET("/faculties", handlers.GetFaculties)
	r.POST("/faculties", handlers.CreateFaculty)
}