package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetAcademicCalendar godoc
// @Summary Get academic calendar
// @Description Returns paginated academic calendar entries
// @Tags Academic Calendar
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedAcademicCalendarResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/academic-calendar [get]
func GetAcademicCalendar(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		var total int64
		if err := app.DB.Model(&models.AcademicCalendar{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var records []models.AcademicCalendar
		if err := app.DB.Order("calendar_date").Limit(limit).Offset(offset).Find(&records).Error; err != nil {
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
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateAcademicCalendar godoc
// @Summary Create academic calendar entry
// @Description Creates a new academic calendar record.
// @Tags Academic Calendar
// @Accept json
// @Produce json
// @Param request body dto.CreateAcademicCalendarRequest true "Academic calendar data"
// @Success 201 {object} models.AcademicCalendarResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/academic-calendar [post]
func CreateAcademicCalendar(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.CreateAcademicCalendarRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		parsedDate, err := time.Parse("2006-01-02", req.CalendarDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid calendar_date format, use YYYY-MM-DD",
			})
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

		if err := app.DB.Create(&record).Error; err != nil {
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
}
