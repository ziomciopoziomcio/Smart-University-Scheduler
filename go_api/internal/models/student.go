package models


type User struct {
	ID            uint   `gorm:"primaryKey"`
	Email         string `gorm:"unique"`
	PasswordHash  string
	Name          string
	Surname       string
	Degree        string
	EmailVerified bool

	Roles []Role `gorm:"many2many:user_roles"`
}

type Role struct {
	ID       uint   `gorm:"primaryKey"`
	RoleName string `gorm:"unique"`

	Users []User `gorm:"many2many:user_roles"`
}

type Student struct {
	ID           uint `gorm:"primaryKey"`
	UserID       uint
	StudyProgram uint
}

type StudyProgram struct {
	ID   uint   `gorm:"primaryKey"`
	ProgramName string `gorm:"unique"`
}

type Major struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique"`
}
