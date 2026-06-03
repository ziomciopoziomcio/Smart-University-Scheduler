package dto

type CreateCampusRequest struct {
	CampusName  string `json:"campus_name" binding:"required"`
	CampusShort string `json:"campus_short" binding:"required"`
}