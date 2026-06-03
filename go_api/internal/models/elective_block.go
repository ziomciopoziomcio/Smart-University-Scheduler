package models

type ElectiveBlock struct {
	ID                int        `json:"id" gorm:"primaryKey;autoIncrement"`
	StudyFieldID      int        `json:"study_field" gorm:"column:study_field"`
	ElectiveBlockName string     `json:"elective_block_name"`
	StudyField        StudyField `json:"-" gorm:"foreignKey:StudyFieldID"`
}

func (ElectiveBlock) TableName() string {
	return "elective_block"
}

type PaginatedElectiveBlocksResponse struct {
	Items []ElectiveBlock `json:"items"`
}