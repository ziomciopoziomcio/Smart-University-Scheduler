package dto

type CreateCourseRequest struct {
	CourseCode        int    `json:"course_code" binding:"required"`
	EctsPoints        int    `json:"ects_points" binding:"required"`
	CourseName        string `json:"course_name" binding:"required"`
	CourseLanguage    string `json:"course_language" binding:"required"`
	LeadingUnit       int    `json:"leading_unit" binding:"required"`
	CourseCoordinator int    `json:"course_coordinator" binding:"required"`
}
