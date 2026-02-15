package main

import (
	"context"
	"log"
	"net/http"

	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"secure-auth-backend/internal/auth"
	"secure-auth-backend/internal/database"
)

func main() {

	databaseURL := "postgres://postgres:admin@localhost:5433/secure_auth"
	db := database.NewPostgres(databaseURL)

	opt := option.WithCredentialsFile("firebase-service-account.json")
	app, _ := firebase.NewApp(context.Background(), nil, opt)
	fbAuth, _ := app.Auth(context.Background())

	jwtSecret := []byte("super-secret-key")

	authService := auth.NewService(db, fbAuth, jwtSecret)
	authHandler := auth.NewHandler(authService)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Auth routes
	r.Post("/auth/exchange", authHandler.Exchange)
	r.Post("/auth/refresh", authHandler.Refresh)
	r.Post("/auth/logout", authHandler.Logout)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(authService.JWTMiddleware)
		r.Get("/profile", authHandler.Profile)
	})

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
