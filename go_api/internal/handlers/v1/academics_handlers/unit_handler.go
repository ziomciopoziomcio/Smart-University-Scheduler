package academics_handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/models"
)

// GetUnits godoc
// @Summary Get units
// @Description Returns list of units with lecturers and courses counts
// @Tags units
// @Produce json
// @Success 200 {object} models.UnitsListResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/units [get]
func GetUnits(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var items []models.UnitResponse

		err := app.DB.Table("units").
			Select(`
				units.id,
				units.unit_name,
				units.faculty_id,
				units.unit_short,
				count(distinct employees.id) as lecturers_count,
				count(distinct courses.course_code) as courses_count
			`).
			Joins("left join employees on employees.unit_id = units.id").
			Joins("left join courses on courses.leading_unit = units.id").
			Group("units.id").
			Order("units.id").
			Scan(&items).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.UnitsListResponse{
			Items: items,
		})
	}
}

// CreateUnit godoc
// @Summary Create unit
// @Description Creates a new unit.
// @Tags units
// @Accept json
// @Produce json
// @Param request body models.Unit true "Unit data"
// @Success 201 {object} models.Unit
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/units [post]
func CreateUnit(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		var unit models.Unit

		if err := c.ShouldBindJSON(&unit); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		var faculty models.Faculty
		if err := app.DB.First(&faculty, unit.FacultyID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "faculty not found",
			})
			return
		}

		if err := app.DB.Create(&unit).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, unit)
	}
}