package main

// Task representa uma tarefa do Kanban.
// As tags `json:"..."` dizem ao Go como converter isso para/de JSON
// (é assim que o front-end em React vai enviar e receber os dados).
type Task struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"` // omitempty = some do JSON se estiver vazio
	Status      string `json:"status"`                 // "todo" | "in_progress" | "done"
}

// Status válidos aceitos pelo sistema.
// Usamos um map como "set" (nem toda linguagem tem um tipo set nativo em Go).
var validStatuses = map[string]bool{
	"todo":        true,
	"in_progress": true,
	"done":        true,
}

func isValidStatus(status string) bool {
	return validStatuses[status]
}
