package dto

type CreateCourseTypeDetailRequest struct {
	Course                     int    `json:"course" binding:"required"`
	ClassType                  string `json:"class_type" binding:"required"`
	ClassHours                 int    `json:"class_hours"`
	SlotsPerClass              int    `json:"slots_per_class"`
	Frequency                  string `json:"frequency"`
	ManualWeeks                []int  `json:"manual_weeks"`
	PCNeeded                   bool   `json:"pc_needed"`
	ProjectorNeeded            bool   `json:"projector_needed"`
	MaxGroupParticipantsNumber int    `json:"max_group_participants_number"`
}
