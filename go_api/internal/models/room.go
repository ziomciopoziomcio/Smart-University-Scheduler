package models

type Room struct {
	ID                    int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoomName              string `json:"room_name" gorm:"size:255;not null"`
	ProjectorAvailability bool   `json:"projector_availability" gorm:"default:false"`
	PCAmount              int    `json:"pc_amount" gorm:"default:0"`
	RoomCapacity          int    `json:"room_capacity" gorm:"default:15"`
	BuildingID            int    `json:"building_id" gorm:"not null"`
	FacultyID             int    `json:"faculty_id" gorm:"not null"`
	UnitID                *int   `json:"unit_id,omitempty"`

	Building Building `json:"-" gorm:"foreignKey:BuildingID"`
	Faculty  Faculty  `json:"-" gorm:"foreignKey:FacultyID"`
}

func (Room) TableName() string {
	return "rooms"
}

type PaginatedRoomsResponse struct {
	Items []Room `json:"items"`
}