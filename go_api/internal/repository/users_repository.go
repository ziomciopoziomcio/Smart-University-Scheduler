package repository

import (
	"go_api/internal/models/users_models"

	"gorm.io/gorm"
)

type UsersRepository struct {
	db *gorm.DB
}

func NewUsersRepository(db *gorm.DB) *UsersRepository {
	return &UsersRepository{db: db}
}

func (r *UsersRepository) GetRoles(limit, offset int) ([]users_models.Role, int64, error) {
	var total int64
	if err := r.db.Model(&users_models.Role{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var roleIDs []int
	if err := r.db.Model(&users_models.Role{}).Order("id").Limit(limit).Offset(offset).Pluck("id", &roleIDs).Error; err != nil {
		return nil, 0, err
	}

	var roles []users_models.Role
	if len(roleIDs) > 0 {
		if err := r.db.Preload("Permissions").Order("id").Where("id IN ?", roleIDs).Find(&roles).Error; err != nil {
			return nil, 0, err
		}
	} else {
		roles = []users_models.Role{}
	}

	return roles, total, nil
}

func (r *UsersRepository) FetchRoleUsersCount() map[int]int {
	type RoleCountRow struct {
		RoleID     int
		UsersCount int
	}
	var countRows []RoleCountRow

	r.db.Table("roles").
		Select("roles.id as role_id, count(user_roles.user_id) as users_count").
		Joins("left join user_roles on user_roles.role_id = roles.id").
		Group("roles.id").
		Scan(&countRows)

	countsMap := make(map[int]int)
	for _, row := range countRows {
		countsMap[row.RoleID] = row.UsersCount
	}
	return countsMap
}

func (r *UsersRepository) CreateRole(role *users_models.Role) error {
	return r.db.Create(role).Error
}

func (r *UsersRepository) GetPermissions(limit, offset int) ([]users_models.Permission, int64, error) {
	var total int64
	if err := r.db.Model(&users_models.Permission{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var permissions []users_models.Permission
	err := r.db.Order("id").Limit(limit).Offset(offset).Find(&permissions).Error

	return permissions, total, err
}

func (r *UsersRepository) CreatePermission(permission *users_models.Permission) error {
	return r.db.Create(permission).Error
}

func (r *UsersRepository) FindRoleAndPermission(roleID int, permissionID int) (*users_models.Role, *users_models.Permission, error) {
	var role users_models.Role
	if err := r.db.First(&role, roleID).Error; err != nil {
		return nil, nil, err
	}

	var permission users_models.Permission
	if err := r.db.First(&permission, permissionID).Error; err != nil {
		return nil, nil, err
	}

	return &role, &permission, nil
}

func (r *UsersRepository) AssignPermissionToRole(role *users_models.Role, permission *users_models.Permission) error {
	return r.db.Model(role).Association("Permissions").Append(permission)
}

func (r *UsersRepository) GetUsers(limit, offset int) ([]users_models.User, int64, error) {
	var total int64
	if err := r.db.Model(&users_models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []users_models.User
	err := r.db.Preload("Roles").Order("id").Limit(limit).Offset(offset).Find(&users).Error

	return users, total, err
}

func (r *UsersRepository) GetUserByID(userId int64) (*users_models.User, error) {
	var dbUser users_models.User
	err := r.db.Preload("Roles").First(&dbUser, userId).Error
	return &dbUser, err
}
