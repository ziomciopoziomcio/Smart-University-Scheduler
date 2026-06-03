package models

type Unit struct {
	ID        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UnitName  string `json:"unit_name" gorm:"size:255;unique"`
	FacultyID int    `json:"faculty_id" gorm:"not null"`
	UnitShort string `json:"unit_short" gorm:"size:255;unique"`
}

func (Unit) TableName() string {
	return "units"
}

type UnitResponse struct {
	ID             int    `json:"id"`
	UnitName       string `json:"unit_name"`
	FacultyID      int    `json:"faculty_id"`
	UnitShort      string `json:"unit_short"`
	LecturersCount int    `json:"lecturers_count"`
	CoursesCount   int    `json:"courses_count"`
}

type UnitsListResponse struct {
	Items []UnitResponse `json:"items"`
}