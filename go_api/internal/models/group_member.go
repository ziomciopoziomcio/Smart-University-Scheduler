package models

type GroupMember struct {
	Group   uint `json:"group" gorm:"primaryKey"`
	Student uint `json:"student" gorm:"primaryKey"`
}

func (GroupMember) TableName() string {
	return "group_members"
}