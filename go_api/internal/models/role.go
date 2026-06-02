package models


type Role struct {
	ID       int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoleName string `json:"role_name" gorm:"size:255;unique"`

	Permissions []Permission `json:"permissions,omitempty" gorm:"many2many:role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (Role) TableName() string {
	return "roles"
}