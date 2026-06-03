package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetAcademicCalendar(c *gin.Context) {
	var records []models.AcademicCalendar

	if err := db.DB.Order("calendar_date").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	items := make([]models.AcademicCalendarResponse, 0, len(records))
	for _, r := range records {
		items = append(items, models.AcademicCalendarResponse{
			CalendarDate:      r.CalendarDate.Format("2006-01-02"),
			AcademicYear:      r.AcademicYear,
			SemesterType:      r.SemesterType,
			WeekNumber:        r.WeekNumber,
			AcademicDayOfWeek: r.AcademicDayOfWeek,
			Description:       r.Description,
		})
	}

	c.JSON(http.StatusOK, models.PaginatedAcademicCalendarResponse{
		Items: items,
	})
}

func CreateAcademicCalendar(c *gin.Context) {
	var req dto.CreateAcademicCalendarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.CalendarDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid calendar_date format, use YYYY-MM-DD"})
		return
	}

	record := models.AcademicCalendar{
		CalendarDate:      parsedDate,
		AcademicYear:      req.AcademicYear,
		SemesterType:      req.SemesterType,
		WeekNumber:        req.WeekNumber,
		AcademicDayOfWeek: req.AcademicDayOfWeek,
		Description:       req.Description,
	}

	if err := db.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.AcademicCalendarResponse{
		CalendarDate:      record.CalendarDate.Format("2006-01-02"),
		AcademicYear:      record.AcademicYear,
		SemesterType:      record.SemesterType,
		WeekNumber:        record.WeekNumber,
		AcademicDayOfWeek: record.AcademicDayOfWeek,
		Description:       record.Description,
	})
}