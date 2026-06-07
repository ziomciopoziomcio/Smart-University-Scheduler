package app

import "gorm.io/gorm"

type App struct {
	DB *gorm.DB
}