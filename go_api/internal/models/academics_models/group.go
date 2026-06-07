package academics_models

type Group struct {
	ID            uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	GroupName     string `json:"group_name" gorm:"size:255;unique;not null"`
	StudyProgram  uint   `json:"study_program" gorm:"not null"`
	Major         *uint  `json:"major" gorm:"default:null"`
	ElectiveBlock *uint  `json:"elective_block" gorm:"default:null"`
	Semester      int    `json:"semester" gorm:"default:1;not null"`
	IsActive      bool   `json:"is_active" gorm:"default:true;not null"`

	Members []GroupMember `gorm:"foreignKey:GroupID;references:ID"`
}

func (Group) TableName() string {
	return "groups"
}
