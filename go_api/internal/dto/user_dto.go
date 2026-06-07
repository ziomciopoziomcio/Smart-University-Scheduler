package dto

type StudentProfileDTO struct {
	StudyProgramId int32 `json:"study_program_id"`
	MajorId        int32 `json:"major_id"`
}

type EmployeeProfileDTO struct {
	FacultyId int32 `json:"faculty_id"`
	UnitId    int32 `json:"unit_id"`
}

type CreateUserRequest struct {
	Email                     string              `json:"email" binding:"required,email"`
	Name                      string              `json:"name" binding:"required"`
	Surname                   string              `json:"surname" binding:"required"`
	PhoneNumber               string              `json:"phone_number"`
	Degree                    string              `json:"degree"`
	SendLoginCredentialsEmail bool                `json:"send_login_credentials_email"`
	Student                   *StudentProfileDTO  `json:"student,omitempty"`
	Employee                  *EmployeeProfileDTO `json:"employee,omitempty"`
}
