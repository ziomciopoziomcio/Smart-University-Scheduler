package models

type Room struct {
	ID                    int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoomName              string `json:"room_name"`

	ProjectorAvailability bool `json:"projector_availability" gorm:"default:false"`
	PCAmount              int  `json:"pc_amount" gorm:"default:0"`
	RoomCapacity          int  `json:"room_capacity" gorm:"default:15"`

	BuildingID int      `json:"building_id"`
	Building   Building `json:"building,omitempty"`

	UnitID    *int `json:"unit_id,omitempty"`
	FacultyID int  `json:"faculty_id"`

	Faculty Faculty `json:"faculty,omitempty"`
}

func (Room) TableName() string {
	return "rooms"
}