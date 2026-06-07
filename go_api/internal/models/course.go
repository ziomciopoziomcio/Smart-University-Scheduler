package models

type Course struct {
	CourseCode        int    `json:"course_code" gorm:"primaryKey;autoIncrement:false"`
	EctsPoints        int    `json:"ects_points" gorm:"not null"`
	CourseName        string `json:"course_name" gorm:"size:255;not null"`
	CourseLanguage    string `json:"course_language" gorm:"size:20;not null"`
	LeadingUnit       int    `json:"leading_unit" gorm:"not null"`
	CourseCoordinator int    `json:"course_coordinator" gorm:"not null"`

	CourseTypes []CourseTypeDetail `json:"-" gorm:"foreignKey:Course"`
}

func (Course) TableName() string {
	return "courses"
}

type PaginatedCoursesResponse struct {
	Items []Course `json:"items"`
}
