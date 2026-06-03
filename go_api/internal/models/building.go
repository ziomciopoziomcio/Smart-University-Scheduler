package models

type Building struct {
	ID             int    `json:"id" gorm:"primaryKey;autoIncrement"`
	BuildingName   string `json:"building_name" gorm:"unique"`
	BuildingNumber string `json:"building_number" gorm:"unique"`
	CampusID       int    `json:"campus_id"`

	Campus    Campus    `json:"-" gorm:"foreignKey:CampusID"`
	Rooms     []Room    `json:"-" gorm:"foreignKey:BuildingID"`
	Faculties []Faculty `json:"-" gorm:"many2many:faculty_buildings;"`
}

func (Building) TableName() string {
	return "buildings"
}

type BuildingReadResponse struct {
	ID             int    `json:"id"`
	BuildingName   string `json:"building_name"`
	BuildingNumber string `json:"building_number"`
	CampusID       int    `json:"campus_id"`
	RoomsNumber    int    `json:"rooms_number"`
}

type PaginatedBuildingsResponse struct {
	Items []BuildingReadResponse `json:"items"`
}