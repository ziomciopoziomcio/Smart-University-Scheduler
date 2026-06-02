package models

type Major struct {
	ID int `json:"id" gorm:"primaryKey;autoIncrement"`

	StudyFieldID *int `json:"study_field_id" binding:"required" gorm:"column:study_field"`

	MajorName string `json:"major_name" binding:"required"`

	StudyField StudyField `json:"study_field,omitempty" gorm:"foreignKey:StudyFieldID"`
}

func (Major) TableName() string {
	return "major"
}