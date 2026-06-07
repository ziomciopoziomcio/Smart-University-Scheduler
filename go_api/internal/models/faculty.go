package models

type Faculty struct {
	ID           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	FacultyName  string `json:"faculty_name" gorm:"unique"`
	FacultyShort string `json:"faculty_short" gorm:"unique"`

	Buildings []Building `json:"-" gorm:"many2many:faculty_buildings;"`
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

type FacultyReadWithCounterResponse struct {
	ID             int    `json:"id"`
	FacultyName    string `json:"faculty_name"`
	FacultyShort   string `json:"faculty_short"`
	LecturersCount int    `json:"lecturers_count"`
	StudentsCount  int    `json:"students_count"`
}

type PaginatedFacultiesResponse struct {
	Items []FacultyReadWithCounterResponse `json:"items"`
}
