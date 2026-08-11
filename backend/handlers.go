package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"sync"
)

// newID gera um identificador único simples, sem depender de pacotes externos.
func newID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// store guarda as tarefas em memória.
// sync.Mutex evita que duas requisições mexam no map ao mesmo tempo
// (o servidor Go atende requisições em paralelo, por padrão).
type Store struct {
	mu    sync.Mutex
	tasks map[string]Task
}

var store = Store{tasks: make(map[string]Task)}

// respondJSON escreve qualquer valor Go como resposta JSON.
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// tasksHandler cuida de GET /tasks e POST /tasks
func tasksHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		store.mu.Lock()
		list := make([]Task, 0, len(store.tasks))
		for _, t := range store.tasks {
			list = append(list, t)
		}
		store.mu.Unlock()
		respondJSON(w, http.StatusOK, list)

	case http.MethodPost:
		var input Task
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			respondError(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		if input.Title == "" {
			respondError(w, http.StatusBadRequest, "título é obrigatório")
			return
		}
		if input.Status == "" {
			input.Status = "todo" // status padrão para tarefa nova
		}
		if !isValidStatus(input.Status) {
			respondError(w, http.StatusBadRequest, "status inválido")
			return
		}
		input.ID = newID()

		store.mu.Lock()
		store.tasks[input.ID] = input
		store.mu.Unlock()

		respondJSON(w, http.StatusCreated, input)

	default:
		respondError(w, http.StatusMethodNotAllowed, "método não permitido")
	}
}

// taskByIDHandler cuida de PUT /tasks/{id} e DELETE /tasks/{id}
func taskByIDHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	store.mu.Lock()
	_, exists := store.tasks[id]
	store.mu.Unlock()
	if !exists {
		respondError(w, http.StatusNotFound, "tarefa não encontrada")
		return
	}

	switch r.Method {
	case http.MethodPut:
		var input Task
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			respondError(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		if input.Title == "" {
			respondError(w, http.StatusBadRequest, "título é obrigatório")
			return
		}
		if !isValidStatus(input.Status) {
			respondError(w, http.StatusBadRequest, "status inválido")
			return
		}
		input.ID = id

		store.mu.Lock()
		store.tasks[id] = input
		store.mu.Unlock()

		respondJSON(w, http.StatusOK, input)

	case http.MethodDelete:
		store.mu.Lock()
		delete(store.tasks, id)
		store.mu.Unlock()
		w.WriteHeader(http.StatusNoContent)

	default:
		respondError(w, http.StatusMethodNotAllowed, "método não permitido")
	}
}
