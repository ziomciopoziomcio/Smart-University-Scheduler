package models


type StudyProgram struct {
	ID          int     `json:"id" gorm:"primaryKey;autoIncrement"`
	StudyField  int     `json:"study_field" gorm:"not null"`
	StartYear   string  `json:"start_year" gorm:"size:20;not null"`
	ProgramName *string `json:"program_name" gorm:"size:255"`

	// Relations
	CurriculumCourses []CurriculumCourse `json:"curriculum_courses" gorm:"foreignKey:StudyProgram"`
}

func (StudyProgram) TableName() string {
	return "study_programs"
}