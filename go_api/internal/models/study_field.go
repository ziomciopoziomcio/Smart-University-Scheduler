package models

type StudyField struct {
	ID int `json:"id" gorm:"primaryKey;autoIncrement"`

	FacultyID int `json:"faculty_id" gorm:"column:faculty"`

	FieldName string `json:"field_name"`
	Language  string `json:"language"`
	Mode      string `json:"mode"`
	Degree    string `json:"degree"`

	Faculty Faculty `json:"faculty,omitempty" gorm:"foreignKey:FacultyID"`
}

func (StudyField) TableName() string {
	return "study_fields"
}