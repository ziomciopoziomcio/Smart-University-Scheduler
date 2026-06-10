package users_handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"go_api/internal/app"
	"go_api/internal/dto/users_dto"
	"go_api/internal/models/users_models"
)

// GetRoles godoc
// @Summary Get roles
// @Description Returns paginated list of roles with permissions and user count
// @Tags roles
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} users_models.PaginatedRolesResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/roles [get]
func GetRoles(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, offset := parsePaginationParams(c)

		roles, total, err := app.Users.GetRoles(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		countsMap := app.Users.FetchRoleUsersCount()
		items := mapRolesToResponse(roles, countsMap)

		c.JSON(http.StatusOK, users_models.PaginatedRolesResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  items,
		})
	}
}

func parsePaginationParams(c *gin.Context) (int, int) {
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
	return limit, offset
}

func mapRolesToResponse(roles []users_models.Role, countsMap map[int]int) []users_models.RoleWithCountResponse {
	items := make([]users_models.RoleWithCountResponse, 0, len(roles))
	for _, r := range roles {
		perms := r.Permissions
		if perms == nil {
			perms = []users_models.Permission{}
		}

		items = append(items, users_models.RoleWithCountResponse{
			ID:          r.ID,
			RoleName:    r.RoleName,
			Permissions: perms,
			UsersCount:  countsMap[r.ID],
		})
	}
	return items
}

// CreateRole godoc
// @Summary Create role
// @Description Creates a new role
// @Tags roles
// @Accept json
// @Produce json
// @Param request body users_dto.CreateRoleRequest true "Role data"
// @Success 201 {object} users_models.Role
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/roles [post]
func CreateRole(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req users_dto.CreateRoleRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		role := users_models.Role{
			RoleName: req.RoleName,
		}

		if err := app.Users.CreateRole(&role); err != nil {
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
// @Success 200 {object} users_models.PaginatedPermissionsResponse
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

		permissions, total, err := app.Users.GetPermissions(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, users_models.PaginatedPermissionsResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  permissions,
		})
	}
}

// CreatePermission godoc
// @Summary Create permission
// @Description Creates a new application permission entry
// @Tags roles
// @Accept json
// @Produce json
// @Param request body users_dto.CreatePermissionRequest true "Permission data"
// @Success 201 {object} users_models.Permission
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/permissions [post]
func CreatePermission(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req users_dto.CreatePermissionRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		permission := users_models.Permission{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			Group:       req.Group,
		}

		if err := app.Users.CreatePermission(&permission); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, permission)
	}
}

// AssignPermissionToRole godoc
// @Summary Assign permission to role
// @Description Binds a specific permission to an existing role entity
// @Tags roles
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Param request body users_dto.AssignPermissionRequest true "Permission Assignment data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/roles/{id}/permissions [post]
func AssignPermissionToRole(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleIDStr := c.Param("id")
		roleID, err := strconv.Atoi(roleIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role id"})
			return
		}

		var req users_dto.AssignPermissionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		role, permission, err := app.Users.FindRoleAndPermission(roleID, req.PermissionID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "role or permission not found"})
			return
		}

		if err := app.Users.AssignPermissionToRole(role, permission); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "permission assigned successfully"})
	}
}
