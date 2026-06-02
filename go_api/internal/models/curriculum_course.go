package models


type CurriculumCourse struct {
	StudyProgram int `gorm:"primaryKey"`
	Course       int `gorm:"primaryKey"`
	Semester     int `gorm:"primaryKey"`

	Major         *int
	ElectiveBlock *int

	// Relations
	StudyProgramRef StudyProgram `gorm:"foreignKey:StudyProgram;references:ID"`
	CourseRef       Course       `gorm:"foreignKey:Course;references:CourseCode"`
}

func (CurriculumCourse) TableName() string {
	return "curriculum_courses"
}