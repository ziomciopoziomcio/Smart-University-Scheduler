package app

import (
	"go_api/internal/repository"

	"gorm.io/gorm"
)

type App struct {
	DB         *gorm.DB
	Academics  *repository.AcademicsRepository
	Courses    *repository.CoursesRepository
	Facilities *repository.FacilitiesRepository
	Users      *repository.UsersRepository
}
