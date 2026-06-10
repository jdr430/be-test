FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o /go-svc .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /go-svc /app/go-svc
COPY ../../data /app/data
EXPOSE 8081
CMD ["/app/go-svc"]
