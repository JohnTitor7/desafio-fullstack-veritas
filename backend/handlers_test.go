package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// TestMain roda antes/depois de toda a suíte. Usamos para apagar o
// tasks.json gerado como efeito colateral dos testes (eles chamam os
// handlers reais, que salvam em disco a cada criação/edição/exclusão).
func TestMain(m *testing.M) {
	code := m.Run()
	os.Remove(dataFile)
	os.Exit(code)
}

// resetStore limpa as tarefas antes de cada teste, para um teste não
// interferir no outro (cada teste começa do zero).
func resetStore() {
	store.mu.Lock()
	store.tasks = make(map[string]Task)
	store.mu.Unlock()
}

// doRequest é um atalho para montar e disparar uma requisição de teste
// contra o router real da aplicação.
func doRequest(t *testing.T, method, path string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reader = bytes.NewReader(b)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	newRouter().ServeHTTP(rec, req)
	return rec
}

func TestCreateTask_Success(t *testing.T) {
	resetStore()

	rec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "Estudar Go", Status: "todo"})

	if rec.Code != http.StatusCreated {
		t.Fatalf("esperava status 201, recebeu %d", rec.Code)
	}

	var created Task
	json.NewDecoder(rec.Body).Decode(&created)
	if created.ID == "" {
		t.Error("esperava um ID gerado, veio vazio")
	}
	if created.Title != "Estudar Go" {
		t.Errorf("título incorreto: %s", created.Title)
	}
}

func TestCreateTask_MissingTitle(t *testing.T) {
	resetStore()

	rec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "", Status: "todo"})

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("esperava status 400 (título obrigatório), recebeu %d", rec.Code)
	}
}

func TestCreateTask_InvalidStatus(t *testing.T) {
	resetStore()

	rec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "Tarefa X", Status: "status_invalido"})

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("esperava status 400 (status inválido), recebeu %d", rec.Code)
	}
}

func TestCreateTask_DefaultStatus(t *testing.T) {
	resetStore()

	// Não informa status: deve assumir "todo" por padrão.
	rec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "Sem status"})

	var created Task
	json.NewDecoder(rec.Body).Decode(&created)
	if created.Status != "todo" {
		t.Errorf("esperava status padrão 'todo', veio '%s'", created.Status)
	}
}

func TestListTasks(t *testing.T) {
	resetStore()
	doRequest(t, http.MethodPost, "/tasks", Task{Title: "Tarefa 1", Status: "todo"})
	doRequest(t, http.MethodPost, "/tasks", Task{Title: "Tarefa 2", Status: "done"})

	rec := doRequest(t, http.MethodGet, "/tasks", nil)

	var list []Task
	json.NewDecoder(rec.Body).Decode(&list)
	if len(list) != 2 {
		t.Fatalf("esperava 2 tarefas, veio %d", len(list))
	}
}

func TestUpdateTask_Success(t *testing.T) {
	resetStore()
	createRec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "Original", Status: "todo"})
	var created Task
	json.NewDecoder(createRec.Body).Decode(&created)

	rec := doRequest(t, http.MethodPut, "/tasks/"+created.ID, Task{Title: "Atualizada", Status: "in_progress"})

	if rec.Code != http.StatusOK {
		t.Fatalf("esperava status 200, recebeu %d", rec.Code)
	}
	var updated Task
	json.NewDecoder(rec.Body).Decode(&updated)
	if updated.Status != "in_progress" {
		t.Errorf("esperava status 'in_progress', veio '%s'", updated.Status)
	}
}

func TestUpdateTask_NotFound(t *testing.T) {
	resetStore()

	rec := doRequest(t, http.MethodPut, "/tasks/id-que-nao-existe", Task{Title: "X", Status: "todo"})

	if rec.Code != http.StatusNotFound {
		t.Fatalf("esperava status 404, recebeu %d", rec.Code)
	}
}

func TestDeleteTask_Success(t *testing.T) {
	resetStore()
	createRec := doRequest(t, http.MethodPost, "/tasks", Task{Title: "Para excluir", Status: "todo"})
	var created Task
	json.NewDecoder(createRec.Body).Decode(&created)

	rec := doRequest(t, http.MethodDelete, "/tasks/"+created.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("esperava status 204, recebeu %d", rec.Code)
	}

	// confirma que sumiu da listagem
	listRec := doRequest(t, http.MethodGet, "/tasks", nil)
	var list []Task
	json.NewDecoder(listRec.Body).Decode(&list)
	if len(list) != 0 {
		t.Errorf("esperava lista vazia após excluir, veio %d item(ns)", len(list))
	}
}

func TestDeleteTask_NotFound(t *testing.T) {
	resetStore()

	rec := doRequest(t, http.MethodDelete, "/tasks/id-que-nao-existe", nil)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("esperava status 404, recebeu %d", rec.Code)
	}
}

func TestHealthCheck(t *testing.T) {
	rec := doRequest(t, http.MethodGet, "/health", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperava status 200, recebeu %d", rec.Code)
	}
}
