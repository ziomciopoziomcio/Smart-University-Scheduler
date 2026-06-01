package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
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

	// 2. Parsujemy JSON-a z żądania Postmana
	var reqBody struct {
		Email                     string `json:"email"`
		Name                      string `json:"name"`
		Surname                   string `json:"surname"`
		PhoneNumber               string `json:"phone_number"`
		Degree                    string `json:"degree"`
		SendLoginCredentialsEmail bool   `json:"send_login_credentials_email"`
	}

	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.CreateUserRPC(ctx, &pb.UserCreateRequest{
		Email:                     reqBody.Email,
		Name:                      reqBody.Name,
		Surname:                   reqBody.Surname,
		PhoneNumber:               reqBody.PhoneNumber,
		Degree:                    reqBody.Degree,
		SendLoginCredentialsEmail: reqBody.SendLoginCredentialsEmail,
	})

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