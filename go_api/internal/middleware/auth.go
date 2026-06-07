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

func hashAPIKey(apiKey string) string {
	hash := sha256.Sum256([]byte(apiKey))
	return hex.EncodeToString(hash[:])
}

func AdminOnly(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		providedAPIKey := c.GetHeader("X-API-Key")

		if providedAPIKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing X-API-Key header"})
			return
		}

		hashedKey := hashAPIKey(providedAPIKey)

		var user models.User
		err := db.Preload("Roles").Where("api_key_hash = ?", hashedKey).First(&user).Error

		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Invalid API key or insufficient permissions"})
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error during key verification"})
			}
			return
		}

		isAdmin := false
		for _, r := range user.Roles {
			if strings.ToLower(r.RoleName) == "administrator" || strings.ToLower(r.RoleName) == "admin" {
				isAdmin = true
				break
			}
		}

		if !isAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Required administrator privileges missing"})
			return
		}

		c.Set("admin_id", user.ID)
		c.Next()
	}
}
