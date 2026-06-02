package models


type Group struct {
	ID             uint   `gorm:"primaryKey;autoIncrement"`
	GroupName      string `gorm:"size:255;unique;not null"`
	StudyProgram   uint   `gorm:"not null"`
	Major          *uint  `gorm:"default:null"`
	ElectiveBlock  *uint  `gorm:"default:null"`
	Semester       int    `gorm:"default:1;not null"`
	IsActive       bool   `gorm:"default:true;not null"`

	// Relations
	Members []GroupMember `gorm:"foreignKey:GroupID"`
}

func (Group) TableName() string {
	return "groups"
}