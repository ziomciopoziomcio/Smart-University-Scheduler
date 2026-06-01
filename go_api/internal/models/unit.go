package models

type Unit struct {
	ID        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UnitName  string `json:"unit_name" gorm:"size:255;unique"`
	FacultyID int    `json:"faculty_id" gorm:"not null"`
	UnitShort string `json:"unit_short" gorm:"size:255;unique"`

	Faculty Faculty `json:"faculty,omitempty" gorm:"foreignKey:FacultyID"`
}

func (Unit) TableName() string {
	return "units"
}