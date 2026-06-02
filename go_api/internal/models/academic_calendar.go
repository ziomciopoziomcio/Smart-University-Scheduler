package models

import (
	"time"
)

type SemesterType string

const (
	SemesterWinter SemesterType = "Winter"
	SemesterSummer SemesterType = "Summer"
)

type AcademicCalendar struct {
	CalendarDate      time.Time    `json:"calendar_date" gorm:"primaryKey;type:date"`
	AcademicYear      string       `json:"academic_year" gorm:"size:20;not null"`
	SemesterType      SemesterType `json:"semester_type" gorm:"type:varchar(20);not null"`
	WeekNumber        int          `json:"week_number" gorm:"not null"`
	AcademicDayOfWeek int          `json:"academic_day_of_week" gorm:"not null"`
	Description       *string      `json:"description" gorm:"size:255"`
}

func (AcademicCalendar) TableName() string {
	return "academic_calendar"
}