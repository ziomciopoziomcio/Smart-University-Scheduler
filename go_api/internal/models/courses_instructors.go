package models


type CoursesInstructors struct {
	Employee  int    `gorm:"primaryKey"`
	Course    int    `gorm:"primaryKey"`
	ClassType string `gorm:"primaryKey;size:20"`

	Hours int `gorm:"default:0"`

	// Relation to CourseTypeDetail
	CourseTypeDetail CourseTypeDetail `gorm:"foreignKey:Course,ClassType;references:Course,ClassType"`
}

func (CoursesInstructors) TableName() string {
	return "courses_instructors"
}