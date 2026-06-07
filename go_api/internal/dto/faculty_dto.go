package dto

type CreateFacultyRequest struct {
	FacultyName  string `json:"faculty_name" binding:"required"`
	FacultyShort string `json:"faculty_short" binding:"required"`
}
