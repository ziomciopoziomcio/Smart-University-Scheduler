package models


type CourseTypeDetail struct {
	Course          int    `json:"course" gorm:"primaryKey"`
	ClassType       string `json:"class_type" gorm:"primaryKey;size:20"`

	ClassHours      int `json:"class_hours" gorm:"default:0"`
	SlotsPerClass   int `json:"slots_per_class" gorm:"default:2"`
	Frequency       string `json:"frequency" gorm:"size:20;default:Every_week"`

	ManualWeeks     []int `json:"manual_weeks" gorm:"serializer:json"`

	PCNeeded        bool `json:"pc_needed" gorm:"default:false"`
	ProjectorNeeded bool `json:"projector_needed" gorm:"default:true"`

	MaxGroupParticipantsNumber int `json:"max_group_participants_number" gorm:"default:15"`

	// Relations
	CourseRef Course `json:"course_ref" gorm:"foreignKey:Course;references:CourseCode"`
}

func (CourseTypeDetail) TableName() string {
	return "course_type_detail"
}