package models

import (
	"time"
)

type User struct {
	ID                         int        `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	PasswordHash               string     `json:"-" gorm:"column:password_hash;type:varchar(255)"`
	Email                      string     `json:"email" gorm:"unique;column:email;type:varchar(255)"`
	PhoneNumber                *string    `json:"phone_number" gorm:"column:phone_number;type:varchar(20)"`
	CreatedAt                  time.Time  `json:"created_at" gorm:"column:created_at;type:timestamp with time zone;default:now()"`
	Name                       string     `json:"name" gorm:"column:name;type:varchar(255)"`
	Surname                    string     `json:"surname" gorm:"column:surname;type:varchar(255)"`
	Degree                     *string    `json:"degree" gorm:"column:degree;type:varchar(255)"`
	TwoFactorEnabled           bool       `json:"two_factor_enabled" gorm:"column:two_factor_enabled;default:false"`
	TwoFactorSecret            *string    `json:"-" gorm:"column:two_factor_secret;type:varchar(64)"`
	BackupCodes                *string    `json:"-" gorm:"column:backup_codes;type:text"`
	PasswordResetTokenHash     *string    `json:"-" gorm:"column:password_reset_token_hash;type:varchar(64)"`
	PasswordResetExpiresAt     *time.Time `json:"-" gorm:"column:password_reset_expires_at;type:timestamp with time zone"`
	EmailVerified              bool       `json:"-" gorm:"column:email_verified;default:false"` // Ukrywamy w liście
	EmailVerificationTokenHash *string    `json:"-" gorm:"column:email_verification_token_hash;type:varchar(64)"`
	EmailVerificationExpiresAt *time.Time `json:"-" gorm:"column:email_verification_expires_at;type:timestamp with time zone"`
	ForcePasswordChange        bool       `json:"-" gorm:"column:force_password_change;default:false"` // Ukrywamy w liście

	Roles []Role `json:"-" gorm:"many2many:user_roles;joinForeignKey:user_id;joinReferences:role_id"`
}

func (User) TableName() string {
	return "users"
}

type UserResponse struct {
	Email            string    `json:"email"`
	PhoneNumber      *string   `json:"phone_number"`
	Name             string    `json:"name"`
	Surname          string    `json:"surname"`
	Degree           *string   `json:"degree"`
	ID               int       `json:"id"`
	CreatedAt        time.Time `json:"created_at"`
	Roles            []string  `json:"roles"`
	TwoFactorEnabled bool      `json:"two_factor_enabled"`
}

type PaginatedUsersResponse struct {
	Items []UserResponse `json:"items"`
}

type UserDetailResponse struct {
	ID               int                    `json:"id"`
	Email            string                 `json:"email"`
	PhoneNumber      *string                `json:"phone_number"`
	Name             string                 `json:"name"`
	Surname          string                 `json:"surname"`
	Degree           *string                `json:"degree"`
	CreatedAt        time.Time              `json:"created_at"`
	TwoFactorEnabled bool                   `json:"two_factor_enabled"`
	Roles            []string               `json:"roles"`
	Student          map[string]interface{} `json:"student,omitempty"`
	Employee         map[string]interface{} `json:"employee,omitempty"`
}
