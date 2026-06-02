package models


type Course struct {
	CourseCode       int    `gorm:"primaryKey;autoIncrement:false"`
	EctsPoints       int    `gorm:"not null"`
	CourseName       string `gorm:"size:255;not null"`
	CourseLanguage   string `gorm:"size:20;not null"`
	LeadingUnit      int    `gorm:"not null"`
	CourseCoordinator int   `gorm:"not null"`

	// Relations
	CourseTypes []CourseTypeDetail `gorm:"foreignKey:Course"`
}

func (Course) TableName() string {
	return "courses"
}