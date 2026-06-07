package dto

type GroupResponse struct {
	ID            uint   `json:"id"`
	GroupName     string `json:"group_name"`
	StudyProgram  uint   `json:"study_program"`
	Major         *uint  `json:"major"`
	ElectiveBlock *uint  `json:"elective_block"`
	Semester      int    `json:"semester"`
	IsActive      bool   `json:"is_active"`
}
