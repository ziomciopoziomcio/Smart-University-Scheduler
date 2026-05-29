package models

type Building struct {
	ID             int    `json:"id" gorm:"primaryKey;autoIncrement"`
	BuildingName   string `json:"building_name" gorm:"unique"`
	BuildingNumber string `json:"building_number" gorm:"unique"`

	CampusID int    `json:"campus_id"`
	Campus   Campus `json:"campus,omitempty"`

	Rooms     []Room    `json:"rooms,omitempty"`
	Faculties []Faculty `json:"faculties,omitempty" gorm:"many2many:faculty_buildings;"`
}

func (Building) TableName() string {
	return "buildings"
}