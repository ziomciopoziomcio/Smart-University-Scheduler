package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"go_api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserApiKey struct {
	UserID     uint   `gorm:"column:user_id"`
	ApiKeyHash string `gorm:"column:api_key_hash"`
}

func hashAPIKey(apiKey string) string {
	hash := sha256.Sum256([]byte(apiKey))
	return hex.EncodeToString(hash[:])
}

func authenticateKey(db *gorm.DB, hashedKey string) (*models.User, error) {
	var keyRecord UserApiKey
	if err := db.Table("user_api_keys").Where("api_key_hash = ?", hashedKey).First(&keyRecord).Error; err != nil {
		return nil, err
	}

	var user models.User
	if err := db.Preload("Roles").Where("id = ?", keyRecord.UserID).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func hasAdminRole(user *models.User) bool {
	for _, r := range user.Roles {
		roleName := strings.ToLower(r.RoleName)
		if roleName == "administrator" || roleName == "admin" {
			return true
		}
	}
	return false
}

func AdminOnly(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		providedAPIKey := c.GetHeader("X-API-Key")
		if providedAPIKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing X-API-Key header"})
			return
		}

		user, err := authenticateKey(db, hashAPIKey(providedAPIKey))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Invalid API key or insufficient permissions"})
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error during key verification"})
			}
			return
		}

		if !hasAdminRole(user) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Required administrator privileges missing"})
			return
		}

		c.Set("admin_id", user.ID)
		c.Next()
	}
}
