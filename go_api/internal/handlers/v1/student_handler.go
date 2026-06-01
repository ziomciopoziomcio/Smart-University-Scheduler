package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

    "crypto/rand"
	"crypto/sha256"
	"golang.org/x/crypto/pbkdf2"
	"encoding/base64"

	"go_api/db"
	"go_api/internal/models"
)

func HashPassword(password string) string {
	salt := make([]byte, 16)
	rand.Read(salt)

	hash := pbkdf2.Key(
		[]byte(password),
		salt,
		310000,
		32,
		sha256.New,
	)

	return base64.StdEncoding.EncodeToString(salt) + "$" +
		base64.StdEncoding.EncodeToString(hash)
}


type CreateStudentRequest struct {
	Email        string  `json:"email" binding:"required,email"`
	Password     string  `json:"password" binding:"required,min=8"`
	Name         string  `json:"name" binding:"required"`
	Surname      string  `json:"surname" binding:"required"`
	Degree       string  `json:"degree"`

	StudyProgram string  `json:"study_program" binding:"required"`
	StartYear    string  `json:"start_year" binding:"required"`

	EmailVerified bool `json:"email_verified" binding:"required"`
	RoleName      string `json:"role_name" binding:"required"`
}


func CreateStudent(c *gin.Context) {
	var req CreateStudentRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// user exists?
	var existingUser models.User

	if err := db.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user with this email already exists",
		})
		return
	}

	// password hash
	// TODO FIX PASSWORD HASHING !!!!!!!!!!!!!!!!!!!!!
	passwordHash := HashPassword(req.Password)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": err.Error(),
// 		})
// 		return
// 	}

	// find study program (by program_name and start_year)
	var studyProgram models.StudyProgram

    if err := db.DB.
        Where("program_name = ? AND start_year = ?", req.StudyProgram, req.StartYear).
        First(&studyProgram).Error; err != nil {

        c.JSON(http.StatusBadRequest, gin.H{
            "error": "study program not found",
        })
        return
    }

    // find role
    var role models.Role

    if err := db.DB.Where("role_name = ?", req.RoleName).First(&role).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "role not found",
        })
        return
    }

	// create user
	user := models.User{
		Email:        req.Email,
		PasswordHash: string(passwordHash),
		Name:         req.Name,
		Surname:      req.Surname,
		Degree:       req.Degree,
		EmailVerified: req.EmailVerified,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

    // assign role
	if err := db.DB.Model(&user).Association("Roles").Append(&role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to assign role",
		})
		return
	}


	// create student
	student := models.Student{
		UserID:       user.ID,
		StudyProgram: studyProgram.ID,
	}

	if err := db.DB.Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"user":    user,
			"student": student,
			"role":    role.RoleName,
		},
	})
}