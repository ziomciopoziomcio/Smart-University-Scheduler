package models

type Permission struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Code        string `json:"code" gorm:"size:100;unique;index"`
	Name        string `json:"name" gorm:"size:100;unique"`
	Description string `json:"description" gorm:"size:200"`
	Group       string `json:"group" gorm:"size:50"`

	Roles []Role `json:"roles,omitempty" gorm:"many2many:role_permissions;foreignKey:ID;joinForeignKey:PermissionID;References:ID;joinReferences:RoleID"`
}

func (Permission) TableName() string {
	return "permissions"
}

type Role struct {
	ID       int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoleName string `json:"role_name" gorm:"size:255;unique"`

	Permissions []Permission `json:"permissions,omitempty" gorm:"many2many:role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (Role) TableName() string {
	return "roles"
}