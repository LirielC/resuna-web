FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
COPY templates ./templates
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /renderer .
FROM ghcr.io/typst/typst:latest
COPY --from=build /renderer /renderer
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/renderer"]
