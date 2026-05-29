package middleware

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v4"
)

type Role struct {
	RoleName string `json:"role_name"`
}

type userMeResponse struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
	Roles []string `json:"roles"`
}

func getSecretKey() (string, error) {
	secret := os.Getenv("SECRET_KEY")
	if secret == "" {
		return "", ErrMissingSecret
	}
	return secret, nil
}

var ErrMissingSecret = errors.New("SECRET_KEY not set")

func parseBearerToken(c *gin.Context) string {
	auth := c.GetHeader("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := parseBearerToken(c)
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		secret, err := getSecretKey()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "server misconfiguration (SECRET_KEY)"})
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok || t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, jwt.ErrTokenMalformed
			}
			return []byte(secret), nil
		})

		if err != nil || token == nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}


		backendURL := os.Getenv("BACKEND_URL")
        if backendURL != "" {
          client := &http.Client{Timeout: 5 * time.Second}
          req, _ := http.NewRequest("GET", strings.TrimRight(backendURL, "/")+"/users/me", nil)
          req.Header.Set("Authorization", "Bearer "+tokenStr)
          resp, err := client.Do(req)

          if err == nil && resp != nil {
             defer resp.Body.Close()
             if resp.StatusCode == http.StatusOK {
                var um userMeResponse
                if err := json.NewDecoder(resp.Body).Decode(&um); err == nil {
                   // Iterujemy bezpośrednio po stringach
                   for _, r := range um.Roles {
                      if strings.ToLower(r) == "administrator" {
                         // Użytkownik jest adminem, puszczamy dalej!
                         c.Next()
                         return
                      }
                   }
                }
             }
          }
		} else {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "server misconfiguration (BACKEND_URL)"})
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Dostęp wzbroniony: tylko dla administratorów"})
	}
}