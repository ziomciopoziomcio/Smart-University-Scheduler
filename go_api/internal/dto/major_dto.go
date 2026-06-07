package dto

type CreateMajorRequest struct {
	StudyField *int   `json:"study_field" binding:"required"`
	MajorName  string `json:"major_name" binding:"required"`
}
