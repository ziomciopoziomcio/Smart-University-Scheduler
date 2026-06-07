package models

type CoursesInstructors struct {
	Employee  int    `json:"employee" gorm:"primaryKey"`
	Course    int    `json:"course" gorm:"primaryKey"`
	ClassType string `json:"class_type" gorm:"primaryKey;size:20"`
	Hours     int    `json:"hours" gorm:"default:0"`

	CourseTypeDetail CourseTypeDetail `json:"-" gorm:"foreignKey:Course,ClassType;references:Course,ClassType"`
}

func (CoursesInstructors) TableName() string {
	return "courses_instructors"
}

type PaginatedCoursesInstructorsResponse struct {
	Total  int64                `json:"total"`
	Limit  int                  `json:"limit"`
	Offset int                  `json:"offset"`
	Items  []CoursesInstructors `json:"items"`
}
