package repository

import (
	"go_api/internal/models/facilities_models"

	"gorm.io/gorm"
)

type FacilitiesRepository struct {
	db *gorm.DB
}

func NewFacilitiesRepository(db *gorm.DB) *FacilitiesRepository {
	return &FacilitiesRepository{db: db}
}

func (r *FacilitiesRepository) GetBuildings(limit, offset int) ([]facilities_models.BuildingReadResponse, int64, error) {
	var total int64
	if err := r.db.Model(&facilities_models.Building{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	roomsSubq := r.db.Table("rooms").Select("count(id)").Where("rooms.building_id = buildings.id")

	var items []facilities_models.BuildingReadResponse
	err := r.db.Table("buildings").
		Select(`
			buildings.id,
			buildings.building_name,
			buildings.building_number,
			buildings.campus_id,
			coalesce((?), 0) as rooms_number
		`, roomsSubq).
		Order("buildings.id").Limit(limit).Offset(offset).Scan(&items).Error

	return items, total, err
}

func (r *FacilitiesRepository) CreateBuilding(building *facilities_models.Building) error {
	return r.db.Create(building).Error
}

func (r *FacilitiesRepository) GetCampuses(limit, offset int) ([]facilities_models.Campus, int64, error) {
	var total int64
	if err := r.db.Model(&facilities_models.Campus{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var campuses []facilities_models.Campus
	err := r.db.Order("id").Limit(limit).Offset(offset).Find(&campuses).Error

	return campuses, total, err
}

func (r *FacilitiesRepository) CreateCampus(campus *facilities_models.Campus) error {
	return r.db.Create(campus).Error
}

func (r *FacilitiesRepository) GetFaculties(limit, offset int) ([]facilities_models.FacultyReadWithCounterResponse, int64, error) {
	var total int64
	if err := r.db.Model(&facilities_models.Faculty{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	lecturersSubq := r.db.Table("employees").Select("count(id)").Where("employees.faculty_id = faculties.id")
	studentsSubq := r.db.Table("students").
		Joins("join study_programs on students.study_program = study_programs.id").
		Joins("join study_fields on study_programs.study_field = study_fields.id").
		Select("count(students.id)").Where("study_fields.faculty = faculties.id")

	var items []facilities_models.FacultyReadWithCounterResponse
	err := r.db.Table("faculties").
		Select(`
			faculties.id,
			faculties.faculty_name,
			faculties.faculty_short,
			coalesce((?), 0) as lecturers_count,
			coalesce((?), 0) as students_count
		`, lecturersSubq, studentsSubq).
		Order("faculties.id").Limit(limit).Offset(offset).Find(&items).Error

	return items, total, err
}

func (r *FacilitiesRepository) CreateFaculty(faculty *facilities_models.Faculty) error {
	return r.db.Create(faculty).Error
}

func (r *FacilitiesRepository) GetRooms(limit, offset int) ([]facilities_models.Room, int64, error) {
	var total int64
	if err := r.db.Model(&facilities_models.Room{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rooms []facilities_models.Room
	err := r.db.Order("id").Limit(limit).Offset(offset).Find(&rooms).Error

	return rooms, total, err
}

func (r *FacilitiesRepository) CreateRoom(room *facilities_models.Room) error {
	return r.db.Create(room).Error
}
