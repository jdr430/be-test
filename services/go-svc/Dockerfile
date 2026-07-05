FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /go-svc .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /go-svc /app/go-svc
EXPOSE 8081
CMD ["/app/go-svc"]
