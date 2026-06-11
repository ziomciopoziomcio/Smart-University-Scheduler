package courses_dto

import "go_api/internal/models/courses_models"

type CourseDetails struct {
	CourseCode int    `json:"course_code"`
	CourseName string `json:"course_name"`
	ECTSPoints int    `json:"ects_points"`
}

type CurriculumCourseResponse struct {
	StudyProgram  int  `json:"study_program"`
	Course        int  `json:"course"`
	Semester      int  `json:"semester"`
	Major         *int `json:"major"`
	ElectiveBlock *int `json:"elective_block"`

	CourseDetails        *CourseDetails            `json:"course_details"`
	MajorDetails         *courses_models.MajorReadResponse `json:"major_details"`
	ElectiveBlockDetails *courses_models.ElectiveBlock     `json:"elective_block_details"`
}

type CreateCurriculumCourseRequest struct {
	StudyProgram  int  `json:"study_program" binding:"required"`
	Course        int  `json:"course" binding:"required"`
	Semester      int  `json:"semester" binding:"required"`
	Major         *int `json:"major"`
	ElectiveBlock *int `json:"elective_block"`
}
