package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	pb "go_api/internal/rpc/user"
)

func CreateUserProxy(c *gin.Context) {
	conn, err := grpc.Dial("backend:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
		return
	}
	defer conn.Close()

	client := pb.NewUserRpcServiceClient(conn)

	var reqBody struct {
		Email                     string `json:"email"`
		Name                      string `json:"name"`
		Surname                   string `json:"surname"`
		PhoneNumber               string `json:"phone_number"`
		Degree                    string `json:"degree"`
		SendLoginCredentialsEmail bool   `json:"send_login_credentials_email"`
		Student *struct {
			StudyProgramId int32 `json:"study_program_id"`
			MajorId        int32 `json:"major_id"`
		} `json:"student"`
		Employee *struct {
			FacultyId int32 `json:"faculty_id"`
			UnitId    int32 `json:"unit_id"`
		} `json:"employee"`
	}

	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grpcReq := &pb.UserCreateRequest{
		Email:                     reqBody.Email,
		Name:                      reqBody.Name,
		Surname:                   reqBody.Surname,
		PhoneNumber:               reqBody.PhoneNumber,
		Degree:                    reqBody.Degree,
		SendLoginCredentialsEmail: reqBody.SendLoginCredentialsEmail,
	}

	if reqBody.Student != nil {
		grpcReq.Profile = &pb.UserCreateRequest_Student{
			Student: &pb.StudentProfile{
				StudyProgramId: reqBody.Student.StudyProgramId,
				MajorId:        reqBody.Student.MajorId,
			},
		}
	} else if reqBody.Employee != nil {
		grpcReq.Profile = &pb.UserCreateRequest_Employee{
			Employee: &pb.EmployeeProfile{
				FacultyId: reqBody.Employee.FacultyId,
				UnitId:    reqBody.Employee.UnitId,
			},
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.CreateUserRPC(ctx, grpcReq)
	if err != nil {
		st, ok := status.FromError(err)
		if ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": st.Message()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal RPC error: " + err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":     resp.Id,
		"email":  resp.Email,
		"status": resp.Status,
	})
}

func DeleteUserProxy(c *gin.Context) {
	idParam := c.Param("id")
	userId, err := strconv.ParseInt(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	conn, err := grpc.Dial("backend:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
		return
	}
	defer conn.Close()

	client := pb.NewUserRpcServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.DeleteUserRPC(ctx, &pb.UserDeleteRequest{Id: int32(userId)})
	if err != nil {
		st, ok := status.FromError(err)
		if ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": st.Message()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": resp.Success,
		"message": resp.Message,
	})
}

func GetUserProxy(c *gin.Context) {
	idParam := c.Param("id")
	userId, err := strconv.ParseInt(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	conn, err := grpc.Dial("backend:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
		return
	}
	defer conn.Close()

	client := pb.NewUserRpcServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.GetUserRPC(ctx, &pb.UserGetRequest{Id: int32(userId)})
	if err != nil {
		st, ok := status.FromError(err)
		// Poprawione z grpc.StatusCode.NOT_FOUND na codes.NotFound
		if ok && st.Code() == codes.NotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": st.Message()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal RPC error: " + err.Error()})
		}
		return
	}

	responseData := gin.H{
		"id":           resp.Id,
		"email":        resp.Email,
		"name":         resp.Name,
		"surname":      resp.Surname,
		"phone_number": resp.PhoneNumber,
		"degree":       resp.Degree,
		"role":         "user",
	}

	if resp.GetStudent() != nil {
		responseData["role"] = "student"
		responseData["student"] = gin.H{
			"study_program_id": resp.GetStudent().StudyProgramId,
			"major_id":        resp.GetStudent().MajorId,
		}
	} else if resp.GetEmployee() != nil {
		responseData["role"] = "employee"
		responseData["employee"] = gin.H{
			"faculty_id": resp.GetEmployee().FacultyId,
			"unit_id":    resp.GetEmployee().UnitId,
		}
	}

	c.JSON(http.StatusOK, responseData)
}