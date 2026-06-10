package repository

import (
	"go_api/internal/models/academics_models"

	"gorm.io/gorm"
)

type AcademicsRepository struct {
	db *gorm.DB
}

func NewAcademicsRepository(db *gorm.DB) *AcademicsRepository {
	return &AcademicsRepository{db: db}
}

func (r *AcademicsRepository) GetAcademicCalendar(limit, offset int) ([]academics_models.AcademicCalendar, int64, error) {
	var total int64
	if err := r.db.Model(&academics_models.AcademicCalendar{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []academics_models.AcademicCalendar
	err := r.db.Order("calendar_date").Limit(limit).Offset(offset).Find(&records).Error
	return records, total, err
}

func (r *AcademicsRepository) CreateAcademicCalendar(record *academics_models.AcademicCalendar) error {
	return r.db.Create(record).Error
}

func (r *AcademicsRepository) GetGroups() ([]academics_models.Group, error) {
	var groups []academics_models.Group
	err := r.db.Find(&groups).Error
	return groups, err
}

func (r *AcademicsRepository) CreateGroup(group *academics_models.Group) error {
	return r.db.Create(group).Error
}

func (r *AcademicsRepository) GetGroupMembers() ([]academics_models.GroupMember, error) {
	var members []academics_models.GroupMember
	err := r.db.Preload("Group").Find(&members).Error
	return members, err
}

func (r *AcademicsRepository) CreateGroupMember(member *academics_models.GroupMember) error {
	return r.db.Create(member).Error
}

func (r *AcademicsRepository) GetUnits() ([]academics_models.UnitResponse, error) {
	var items []academics_models.UnitResponse
	err := r.db.Table("units").
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
		Find(&items).Error
	return items, err
}

func (r *AcademicsRepository) CreateUnit(unit *academics_models.Unit) error {
	return r.db.Create(unit).Error
}
