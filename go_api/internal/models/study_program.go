package models


type StudyProgram struct {
	ID          int     `gorm:"primaryKey;autoIncrement"`
	StudyField  int     `gorm:"not null"`
	StartYear   string  `gorm:"size:20;not null"`
	ProgramName *string `gorm:"size:255"`

	// Relations
	CurriculumCourses []CurriculumCourse `gorm:"foreignKey:StudyProgram"`
}

func (StudyProgram) TableName() string {
	return "study_programs"
}