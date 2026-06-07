package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto"
	"go_api/internal/models"
)

// GetRoles godoc
// @Summary Get roles
// @Description Returns paginated list of roles with permissions and user count
// @Tags roles
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedRolesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/roles [get]
func GetRoles(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		var total int64
		if err := app.DB.Model(&models.Role{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var roles []models.Role

		if err := app.DB.Preload("Permissions").Order("id").Limit(limit).Offset(offset).Find(&roles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		type RoleCountRow struct {
			RoleID     int
			UsersCount int
		}

		var countRows []RoleCountRow

		app.DB.Table("roles").
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
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

// CreateRole godoc
// @Summary Create role
// @Description Creates a new role
// @Tags roles
// @Accept json
// @Produce json
// @Param request body dto.CreateRoleRequest true "Role data"
// @Success 201 {object} models.Role
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/roles [post]
func CreateRole(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.CreateRoleRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		role := models.Role{
			RoleName: req.RoleName,
		}

		if err := app.DB.Create(&role).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusCreated)
	}
}

// GetPermissions godoc
// @Summary Get permissions
// @Description Returns paginated list of permissions
// @Tags roles
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} models.PaginatedPermissionsResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/permissions [get]
func GetPermissions(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		var total int64
		if err := app.DB.Model(&models.Permission{}).Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var permissions []models.Permission

		if err := app.DB.Order("id").Limit(limit).Offset(offset).Find(&permissions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.PaginatedPermissionsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  permissions,
		})
	}
}

// CreatePermission godoc
func CreatePermission(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		if err := app.DB.Create(&permission).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, permission)
	}
}

// AssignPermissionToRole godoc
func AssignPermissionToRole(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
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
		if err := app.DB.First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
			return
		}

		var permission models.Permission
		if err := app.DB.First(&permission, req.PermissionID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
			return
		}

		if err := app.DB.Model(&role).Association("Permissions").Append(&permission); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "permission assigned successfully"})
	}
}
