package models

type Major struct {
	ID           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	StudyFieldID *int   `json:"study_field" gorm:"column:study_field"`
	MajorName    string `json:"major_name"`

	StudyField StudyField `json:"-" gorm:"foreignKey:StudyFieldID"`
}

func (Major) TableName() string {
	return "major"
}

type MajorReadResponse struct {
	ID         int    `json:"id"`
	StudyField *int   `json:"study_field"`
	MajorName  string `json:"major_name"`
	GroupCount int    `json:"group_count"`
}

type PaginatedMajorsResponse struct {
	Items []MajorReadResponse `json:"items"`
}
