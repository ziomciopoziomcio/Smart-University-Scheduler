package models

type Role struct {
	ID       int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoleName string `json:"role_name" gorm:"size:255;unique"`

	Permissions []Permission `json:"permissions,omitempty" gorm:"many2many:role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (Role) TableName() string {
	return "roles"
}

type RoleWithCountResponse struct {
	ID          int          `json:"id"`
	RoleName    string       `json:"role_name"`
	Permissions []Permission `json:"permissions"`
	UsersCount  int          `json:"users_count"`
}

type PaginatedRolesResponse struct {
	Items []RoleWithCountResponse `json:"items"`
}

type PaginatedPermissionsResponse struct {
	Items []Permission `json:"items"`
}
