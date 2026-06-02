package models


type CoursesInstructors struct {
	Employee  int    `json:"employee" gorm:"primaryKey"`
	Course    int    `json:"course" gorm:"primaryKey"`
	ClassType string `json:"class_type" gorm:"primaryKey;size:20"`

	Hours int `json:"hours" gorm:"default:0"`

	// Relation to CourseTypeDetail
	CourseTypeDetail CourseTypeDetail `json:"course_type_detail" gorm:"foreignKey:Course,ClassType;references:Course,ClassType"`
}

func (CoursesInstructors) TableName() string {
	return "courses_instructors"
}