package models

type Faculty struct {
	ID           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	FacultyName  string `json:"faculty_name" gorm:"unique"`
	FacultyShort string `json:"faculty_short" gorm:"unique"`

	Buildings []Building `json:"buildings,omitempty" gorm:"many2many:faculty_buildings;"`
}

func (Faculty) TableName() string {
	return "faculties"
}

type FacultyBuilding struct {
	FacultyID  int `json:"faculty_id" gorm:"primaryKey"`
	BuildingID int `json:"building_id" gorm:"primaryKey"`
}

func (FacultyBuilding) TableName() string {
	return "faculty_buildings"
}