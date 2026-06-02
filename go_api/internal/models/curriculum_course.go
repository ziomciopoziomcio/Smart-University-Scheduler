package models


type CurriculumCourse struct {
	StudyProgram int `json:"study_program" gorm:"primaryKey"`
	Course       int `json:"course" gorm:"primaryKey"`
	Semester     int `json:"semester" gorm:"primaryKey"`

	Major         *int `json:"major"`
	ElectiveBlock *int `json:"elective_block"`

	// Relations
	StudyProgramRef StudyProgram `json:"study_program_ref" gorm:"foreignKey:StudyProgram;references:ID"`
	CourseRef       Course       `json:"course_ref" gorm:"foreignKey:Course;references:CourseCode"`
}

func (CurriculumCourse) TableName() string {
	return "curriculum_courses"
}