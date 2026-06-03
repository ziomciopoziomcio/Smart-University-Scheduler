package models

import "time"

type AcademicCalendar struct {
	CalendarDate     time.Time `gorm:"primaryKey;column:calendar_date"`
	AcademicYear     string    `gorm:"column:academic_year"`
	SemesterType     string    `gorm:"column:semester_type"`
	WeekNumber       int       `gorm:"column:week_number"`
	AcademicDayOfWeek int       `gorm:"column:academic_day_of_week"`
	Description      *string   `gorm:"column:description"`
}

func (AcademicCalendar) TableName() string {
	return "academic_calendar"
}

type AcademicCalendarResponse struct {
	CalendarDate      string  `json:"calendar_date"`
	AcademicYear      string  `json:"academic_year"`
	SemesterType      string  `json:"semester_type"`
	WeekNumber        int     `json:"week_number"`
	AcademicDayOfWeek int     `json:"academic_day_of_week"`
	Description       *string `json:"description"`
}

type PaginatedAcademicCalendarResponse struct {
	Items []AcademicCalendarResponse `json:"items"`
}