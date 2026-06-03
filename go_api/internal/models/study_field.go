package models

type StudyField struct {
	ID        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	FacultyID int    `json:"faculty_id" gorm:"column:faculty"`
	FieldName string `json:"field_name"`
	Language  string `json:"language"`
	Mode      string `json:"mode"`
	Degree    string `json:"degree"`
}

func (StudyField) TableName() string {
	return "study_fields"
}

type StudyFieldListSummaryResponse struct {
	ID                   int    `json:"id"`
	Faculty              int    `json:"faculty"`
	FieldName            string `json:"field_name"`
	Language             string `json:"language"`
	Mode                 string `json:"mode"`
	Degree               string `json:"degree"`
	SemestersCount       int    `json:"semesters_count"`
	SpecializationsCount int    `json:"specializations_count"`
	ElectiveBlocksCount  int    `json:"elective_blocks_count"`
	ProgramsCount        int    `json:"programs_count"`
}

type PaginatedStudyFieldsResponse struct {
	Items []StudyFieldListSummaryResponse `json:"items"`
}