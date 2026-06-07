package repository

import (
	"go_api/internal/models/courses_models"

	"gorm.io/gorm"
)

type CoursesRepository struct {
	db *gorm.DB
}

func NewCoursesRepository(db *gorm.DB) *CoursesRepository {
	return &CoursesRepository{db: db}
}

func (r *CoursesRepository) GetCoursesInstructors(limit, offset int) ([]courses_models.CoursesInstructors, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.CoursesInstructors{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.CoursesInstructors
	err := r.db.Order("employee, course, class_type").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) FindCourseTypeDetail(course int, classType string) (*courses_models.CourseTypeDetail, error) {
	var ctd courses_models.CourseTypeDetail
	err := r.db.Where("course = ? AND class_type = ?", course, classType).First(&ctd).Error
	return &ctd, err
}

func (r *CoursesRepository) CreateCoursesInstructor(item *courses_models.CoursesInstructors) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetCourseTypeDetails(limit, offset int) ([]courses_models.CourseTypeDetail, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.CourseTypeDetail{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.CourseTypeDetail
	err := r.db.Order("course, class_type").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) CreateCourseTypeDetail(item *courses_models.CourseTypeDetail) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetCourses(limit, offset int) ([]courses_models.Course, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.Course{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.Course
	err := r.db.Order("course_code").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) CreateCourse(item *courses_models.Course) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetCurriculumCourses(limit, offset int) ([]courses_models.CurriculumCourse, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.CurriculumCourse{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.CurriculumCourse
	err := r.db.Preload("CourseRef").Preload("MajorRef").Preload("ElectiveBlockRef").
		Order("study_program, course, semester").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) FetchMajorGroupCounts() map[int]int {
	type MajorCountRow struct {
		MajorID    int
		GroupCount int
	}
	var countRows []MajorCountRow
	r.db.Table("groups").Select("major as major_id, count(id) as group_count").
		Where("major is not null").Group("major").Scan(&countRows)

	majorCounts := make(map[int]int)
	for _, row := range countRows {
		majorCounts[row.MajorID] = row.GroupCount
	}
	return majorCounts
}

func (r *CoursesRepository) CreateCurriculumCourse(item *courses_models.CurriculumCourse) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetElectiveBlocks(limit, offset int) ([]courses_models.ElectiveBlock, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.ElectiveBlock{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.ElectiveBlock
	err := r.db.Order("id").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) CreateElectiveBlock(item *courses_models.ElectiveBlock) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetMajors(limit, offset int) ([]courses_models.MajorReadResponse, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.Major{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.MajorReadResponse
	err := r.db.Table("major").
		Select("major.id, major.study_field, major.major_name, coalesce(count(groups.id), 0) as group_count").
		Joins("left join groups on groups.major = major.id").
		Group("major.id").Order("major.id").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) CreateMajor(item *courses_models.Major) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetStudyFields(limit, offset int) ([]courses_models.StudyFieldListSummaryResponse, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.StudyField{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	electiveBlocksSubq := r.db.Table("elective_block").Select("count(id)").Where("elective_block.study_field = study_fields.id")
	programsSubq := r.db.Table("study_programs").Select("count(id)").Where("study_programs.study_field = study_fields.id")

	var items []courses_models.StudyFieldListSummaryResponse
	err := r.db.Table("study_fields").
		Select(`
			study_fields.id, study_fields.faculty as faculty, study_fields.field_name, study_fields.language, study_fields.mode, study_fields.degree,
			coalesce(count(distinct major.id), 0) as specializations_count, coalesce(max(curriculum_courses.semester), 0) as semesters_count,
			coalesce((?), 0) as elective_blocks_count, coalesce((?), 0) as programs_count
		`, electiveBlocksSubq, programsSubq).
		Joins("left join major on study_fields.id = major.study_field").
		Joins("left join study_programs on study_fields.id = study_programs.study_field").
		Joins("left join curriculum_courses on study_programs.id = curriculum_courses.study_program").
		Group("study_fields.id").Order("study_fields.id").Limit(limit).Offset(offset).Find(&items).Error

	return items, total, err
}

func (r *CoursesRepository) CreateStudyField(item *courses_models.StudyField) error {
	return r.db.Create(item).Error
}

func (r *CoursesRepository) GetStudyPrograms(limit, offset int) ([]courses_models.StudyProgram, int64, error) {
	var total int64
	if err := r.db.Model(&courses_models.StudyProgram{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []courses_models.StudyProgram
	err := r.db.Order("id").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *CoursesRepository) FetchSemesterSummary(programID int) ([]courses_models.SemesterSummary, int) {
	type SummaryRow struct {
		Semester     int
		CoursesCount int
		EctsSum      int
	}
	var rows []SummaryRow

	r.db.Table("curriculum_courses").
		Select("curriculum_courses.semester as semester, count(curriculum_courses.course) as courses_count, coalesce(sum(courses.ects_points), 0) as ects_sum").
		Joins("join courses on curriculum_courses.course = courses.course_code").
		Where("curriculum_courses.study_program = ?", programID).
		Group("curriculum_courses.semester").Order("curriculum_courses.semester").Scan(&rows)

	maxSem := 0
	perSemMap := make(map[int]courses_models.SemesterSummary)
	for _, row := range rows {
		if row.Semester > maxSem {
			maxSem = row.Semester
		}
		perSemMap[row.Semester] = courses_models.SemesterSummary{
			SemesterNumber: row.Semester,
			CoursesCount:   row.CoursesCount,
			EctsSum:        row.EctsSum,
		}
	}

	var semesterSummary []courses_models.SemesterSummary
	for s := 1; s <= maxSem; s++ {
		if entry, ok := perSemMap[s]; ok {
			semesterSummary = append(semesterSummary, entry)
		} else {
			semesterSummary = append(semesterSummary, courses_models.SemesterSummary{SemesterNumber: s, CoursesCount: 0, EctsSum: 0})
		}
	}
	return semesterSummary, maxSem
}

func (r *CoursesRepository) CreateStudyProgram(item *courses_models.StudyProgram) error {
	return r.db.Create(item).Error
}
