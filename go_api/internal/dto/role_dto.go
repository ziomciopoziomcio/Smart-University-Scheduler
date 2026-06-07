package dto

type CreateRoleRequest struct {
	RoleName string `json:"role_name" binding:"required"`
}

type CreatePermissionRequest struct {
	Code        string `json:"code" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Group       string `json:"group"`
}

type AssignPermissionRequest struct {
	PermissionID int `json:"permission_id" binding:"required"`
}
