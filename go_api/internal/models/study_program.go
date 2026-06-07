package models

type StudyProgram struct {
	ID          int     `json:"id" gorm:"primaryKey;autoIncrement"`
	StudyField  int     `json:"study_field" gorm:"not null"`
	StartYear   string  `json:"start_year" gorm:"size:20;not null"`
	ProgramName *string `json:"program_name" gorm:"size:255"`

	CurriculumCourses []CurriculumCourse `json:"-" gorm:"foreignKey:StudyProgram"`
}

func (StudyProgram) TableName() string {
	return "study_programs"
}

type SemesterSummary struct {
	SemesterNumber int `json:"semester_number"`
	CoursesCount   int `json:"courses_count"`
	EctsSum        int `json:"ects_sum"`
}

type StudyProgramDetailResponse struct {
	ID              int               `json:"id"`
	StudyField      int               `json:"study_field"`
	StartYear       string            `json:"start_year"`
	ProgramName     *string           `json:"program_name"`
	SemestersCount  int               `json:"semesters_count"`
	SemesterSummary []SemesterSummary `json:"semester_summary"`
}

type PaginatedStudyProgramsResponse struct {
	Items []StudyProgramDetailResponse `json:"items"`
}
