package models

type GroupMember struct {
	GroupID   uint `gorm:"primaryKey"`
	StudentID uint `gorm:"primaryKey"`
}

func (GroupMember) TableName() string {
	return "group_members"
}