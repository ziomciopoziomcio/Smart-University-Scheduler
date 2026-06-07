package dto

type CreateAcademicCalendarRequest struct {
	CalendarDate      string  `json:"calendar_date" binding:"required"`
	AcademicYear      string  `json:"academic_year" binding:"required"`
	SemesterType      string  `json:"semester_type" binding:"required"`
	WeekNumber        int     `json:"week_number" binding:"required"`
	AcademicDayOfWeek int     `json:"academic_day_of_week" binding:"required"`
	Description       *string `json:"description"`
}
