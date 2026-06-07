package courses_dto

type CreateElectiveBlockRequest struct {
	StudyField        int    `json:"study_field" binding:"required"`
	ElectiveBlockName string `json:"elective_block_name" binding:"required"`
}
