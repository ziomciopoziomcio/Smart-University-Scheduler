package courses_models

type CurriculumCourse struct {
	StudyProgram int `json:"study_program" gorm:"primaryKey"`
	Course       int `json:"course" gorm:"primaryKey"`
	Semester     int `json:"semester" gorm:"primaryKey"`

	Major         *int `json:"major"`
	ElectiveBlock *int `json:"elective_block"`

	// Relations
	CourseRef       Course       `json:"course_ref" gorm:"foreignKey:Course;references:CourseCode"`
	StudyProgramRef StudyProgram `json:"study_program_ref" gorm:"foreignKey:StudyProgram;references:ID"`

	MajorRef         *Major         `json:"major_ref,omitempty" gorm:"foreignKey:Major;references:ID"`
	ElectiveBlockRef *ElectiveBlock `json:"elective_block_ref,omitempty" gorm:"foreignKey:ElectiveBlock;references:ID"`
}

func (CurriculumCourse) TableName() string {
	return "curriculum_courses"
}

type PaginatedCurriculumCoursesResponse struct {
	Total  int64              `json:"total"`
	Limit  int                `json:"limit"`
	Offset int                `json:"offset"`
	Items  []CurriculumCourse `json:"items"`
}
