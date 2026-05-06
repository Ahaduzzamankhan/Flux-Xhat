package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

var adminFirestoreClient *firestore.Client

func init() {
	godotenv.Load("../.env")

	ctx := context.Background()
	var err error
	adminFirestoreClient, err = firestore.NewClient(ctx, os.Getenv("FIREBASE_PROJECT_ID"))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
}

func main() {
	r := mux.NewRouter()

	// Admin routes
	r.HandleFunc("/admin/users", listAllUsersHandler).Methods("GET")
	r.HandleFunc("/admin/users/{id}", getUserDetailsHandler).Methods("GET")
	r.HandleFunc("/admin/users/{id}/ban", banUserHandler).Methods("POST")
	r.HandleFunc("/admin/chats", listAllChatsHandler).Methods("GET")
	r.HandleFunc("/admin/stats", getStatsHandler).Methods("GET")

	port := "8081"
	log.Printf("Go admin backend starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func listAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	iter := adminFirestoreClient.Collection("users").Documents(ctx)

	var users []map[string]interface{}
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var user map[string]interface{}
		doc.DataTo(&user)
		user["id"] = doc.Ref.ID
		users = append(users, user)
	}

	json.NewEncoder(w).Encode(users)
}

func getUserDetailsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	ctx := context.Background()
	doc, err := adminFirestoreClient.Collection("users").Doc(userID).Get(ctx)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var user map[string]interface{}
	doc.DataTo(&user)
	user["id"] = doc.Ref.ID

	json.NewEncoder(w).Encode(user)
}

func banUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	ctx := context.Background()
	_, err := adminFirestoreClient.Collection("users").Doc(userID).Update(ctx, []firestore.Update{
		{Path: "banned", Value: true},
		{Path: "banned_at", Value: time.Now()},
	})
	if err != nil {
		http.Error(w, "Failed to ban user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "banned"})
}

func listAllChatsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	iter := adminFirestoreClient.Collection("chats").Documents(ctx)

	var chats []map[string]interface{}
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var chat map[string]interface{}
		doc.DataTo(&chat)
		chat["id"] = doc.Ref.ID
		chats = append(chats, chat)
	}

	json.NewEncoder(w).Encode(chats)
}

func getStatsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	usersCount, _ := adminFirestoreClient.Collection("users").Count(ctx).Get(ctx)
	chatsCount, _ := adminFirestoreClient.Collection("chats").Count(ctx).Get(ctx)
	messagesCount, _ := adminFirestoreClient.CollectionGroup("messages").Count(ctx).Get(ctx)

	stats := map[string]interface{}{
		"total_users":    usersCount.Value,
		"total_chats":    chatsCount.Value,
		"total_messages": messagesCount.Value,
		"timestamp":      time.Now(),
	}

	json.NewEncoder(w).Encode(stats)
}
