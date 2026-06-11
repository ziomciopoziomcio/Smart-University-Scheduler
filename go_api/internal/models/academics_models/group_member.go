package academics_models

type GroupMember struct {
	GroupID   uint `json:"group" gorm:"primaryKey;column:group"`
	StudentID uint `json:"student" gorm:"primaryKey;column:student"`

	Group Group `json:"-" gorm:"foreignKey:GroupID;references:ID"`
}

func (GroupMember) TableName() string {
	return "group_members"
}
