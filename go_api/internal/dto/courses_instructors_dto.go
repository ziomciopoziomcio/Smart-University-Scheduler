package dto

type CreateCourseInstructorRequest struct {
	Employee  int    `json:"employee" binding:"required"`
	Course    int    `json:"course" binding:"required"`
	ClassType string `json:"class_type" binding:"required"`
	Hours     int    `json:"hours"`
}