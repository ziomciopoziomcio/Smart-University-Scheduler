package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/db"
	"go_api/internal/dto"
	"go_api/internal/models"
)

func GetRoles(c *gin.Context) {
	var roles []models.Role

	if err := db.DB.Preload("Permissions").Order("id").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type RoleCountRow struct {
		RoleID     int
		UsersCount int
	}
	var countRows []RoleCountRow

	db.DB.Table("roles").
		Select("roles.id as role_id, count(user_roles.user_id) as users_count").
		Joins("left join user_roles on user_roles.role_id = roles.id").
		Group("roles.id").
		Scan(&countRows)

	countsMap := make(map[int]int)
	for _, row := range countRows {
		countsMap[row.RoleID] = row.UsersCount
	}

	var items []models.RoleWithCountResponse
	for _, r := range roles {
		perms := r.Permissions
		if perms == nil {
			perms = []models.Permission{}
		}

		items = append(items, models.RoleWithCountResponse{
			ID:          r.ID,
			RoleName:    r.RoleName,
			Permissions: perms,
			UsersCount:  countsMap[r.ID],
		})
	}

	c.JSON(http.StatusOK, models.PaginatedRolesResponse{
		Items: items,
	})
}

// POST /roles
func CreateRole(c *gin.Context) {
	var req dto.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.Role{
		RoleName: req.RoleName,
	}

	if err := db.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, role)
}

func GetPermissions(c *gin.Context) {
	var permissions []models.Permission

	if err := db.DB.Order("id").Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PaginatedPermissionsResponse{
		Items: permissions,
	})
}

func CreatePermission(c *gin.Context) {
	var req dto.CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission := models.Permission{
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		Group:       req.Group,
	}

	if err := db.DB.Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, permission)
}

func AssignPermissionToRole(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := strconv.Atoi(roleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role id"})
		return
	}

	var req dto.AssignPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var role models.Role
	if err := db.DB.First(&role, roleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}

	var permission models.Permission
	if err := db.DB.First(&permission, req.PermissionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
		return
	}

	if err := db.DB.Model(&role).Association("Permissions").Append(&permission); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "permission assigned successfully"})
}