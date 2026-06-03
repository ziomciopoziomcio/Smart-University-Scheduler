package models

type ElectiveBlock struct {
	ID              int `json:"id" gorm:"primaryKey;autoIncrement"`
	StudyFieldID    int `json:"study_field_id" binding:"required" gorm:"column:study_field"`
	ElectiveBlockName string `json:"elective_block_name" binding:"required"`
	StudyField      StudyField `json:"-" gorm:"foreignKey:StudyFieldID"`
}

func (ElectiveBlock) TableName() string {
	return "elective_block"
}