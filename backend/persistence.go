package main

import (
	"encoding/json"
	"log"
	"os"
)

// dataFile é o arquivo onde as tarefas ficam salvas em disco.
// Pode ser sobrescrito pela variável de ambiente TASKS_FILE (usado no Docker).
var dataFile = getDataFilePath()

func getDataFilePath() string {
	if path := os.Getenv("TASKS_FILE"); path != "" {
		return path
	}
	return "tasks.json"
}

func saveToDisk() {
	store.mu.Lock()
	list := make([]Task, 0, len(store.tasks))
	for _, t := range store.tasks {
		list = append(list, t)
	}
	store.mu.Unlock()

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		log.Printf("erro ao serializar tarefas: %v", err)
		return
	}
	if err := os.WriteFile(dataFile, data, 0644); err != nil {
		log.Printf("erro ao salvar %s: %v", dataFile, err)
	}
}

func loadFromDisk() {
	data, err := os.ReadFile(dataFile)
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("nenhum tasks.json encontrado, começando com lista vazia")
			return
		}
		log.Printf("erro ao ler %s: %v", dataFile, err)
		return
	}

	var list []Task
	if err := json.Unmarshal(data, &list); err != nil {
		log.Printf("erro ao interpretar %s: %v", dataFile, err)
		return
	}

	store.mu.Lock()
	for _, t := range list {
		store.tasks[t.ID] = t
	}
	store.mu.Unlock()

	log.Printf("%d tarefa(s) carregada(s) de %s", len(list), dataFile)
}
