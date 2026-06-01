package models

import (
	"time"
)

type User struct {
	ID                         int       `gorm:"primaryKey;autoIncrement;column:id"`
	PasswordHash               string    `gorm:"column:password_hash;type:varchar(255)"`
	Email                      string    `gorm:"unique;column:email;type:varchar(255)"`
	PhoneNumber                *string   `gorm:"column:phone_number;type:varchar(20)"`
	CreatedAt                  time.Time `gorm:"column:created_at;type:timestamp with time zone;default:now()"`
	Name                       string    `gorm:"column:name;type:varchar(255)"`
	Surname                    string    `gorm:"column:surname;type:varchar(255)"`
	Degree                     *string   `gorm:"column:degree;type:varchar(255)"`
	TwoFactorEnabled           bool      `gorm:"column:two_factor_enabled;default:false"`
	TwoFactorSecret            *string   `gorm:"column:two_factor_secret;type:varchar(64)"`
	BackupCodes                *string   `gorm:"column:backup_codes;type:text"`
	PasswordResetTokenHash     *string   `gorm:"column:password_reset_token_hash;type:varchar(64)"`
	PasswordResetExpiresAt     *time.Time `gorm:"column:password_reset_expires_at;type:timestamp with time zone"`
	EmailVerified              bool      `gorm:"column:email_verified;default:false"`
	EmailVerificationTokenHash *string   `gorm:"column:email_verification_token_hash;type:varchar(64)"`
	EmailVerificationExpiresAt *time.Time `gorm:"column:email_verification_expires_at;type:timestamp with time zone"`
	ForcePasswordChange        bool      `gorm:"column:force_password_change;default:false"`
	ApiKeyHash                 *string   `gorm:"column:api_key_hash;type:varchar(64);unique;index"`

	Roles []Role `gorm:"many2many:user_roles;joinForeignKey:user_id;joinReferences:role_id"`
}

func (User) TableName() string {
	return "users"
}

type Role struct {
	ID       int    `gorm:"primaryKey;autoIncrement;column:id"`
	RoleName string `gorm:"unique;column:role_name;type:varchar(255)"`
}

func (Role) TableName() string {
	return "roles"
}