FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/server .
COPY .env .
ENV GIN_MODE=release
EXPOSE 8080
ENTRYPOINT ["/app/server"]
