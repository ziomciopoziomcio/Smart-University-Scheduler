FROM golang:1.25.10-alpine

RUN apk update && apk add --no-cache protobuf protobuf-dev git

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

ENV PATH="$PATH:$(go env GOPATH)/bin"

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main .

EXPOSE 8080

CMD ["./main"]