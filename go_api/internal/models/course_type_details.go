package models


type CourseTypeDetail struct {
	Course    int    `gorm:"primaryKey"`
	ClassType string `gorm:"primaryKey;size:20"`

	ClassHours                int `gorm:"default:0"`
	SlotsPerClass             int `gorm:"default:2"`
	Frequency                 string `gorm:"size:20;default:Every_week"`

	ManualWeeks []int `gorm:"serializer:json"`

	PCNeeded        bool `gorm:"default:false"`
	ProjectorNeeded bool `gorm:"default:true"`

	MaxGroupParticipantsNumber int `gorm:"default:15"`

	// Relations
	CourseRef Course `gorm:"foreignKey:Course;references:CourseCode"`
}

func (CourseTypeDetail) TableName() string {
	return "course_type_detail"
}