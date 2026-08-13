package main

import (
	"log"
	"net/http"
)

// corsMiddleware libera o acesso do front-end (rodando em outra porta)
// para chamar essa API. Sem isso, o navegador bloqueia a requisição.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Requisições "preflight" (o navegador pergunta antes se pode mandar
		// PUT/DELETE com JSON). Respondemos OK sem processar nada.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// newRouter monta as rotas da aplicação. Extraído em função separada
// para que os testes possam usar exatamente o mesmo roteamento do servidor real.
func newRouter() http.Handler {
	mux := http.NewServeMux()

	// Go 1.22+ permite registrar método + caminho direto no padrão da rota.
	mux.HandleFunc("GET /tasks", tasksHandler)
	mux.HandleFunc("POST /tasks", tasksHandler)
	mux.HandleFunc("PUT /tasks/{id}", taskByIDHandler)
	mux.HandleFunc("DELETE /tasks/{id}", taskByIDHandler)

	// health check simples, útil para conferir se o servidor está no ar
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return corsMiddleware(mux)
}

func main() {
	loadFromDisk()
	handler := newRouter()

	log.Println("Servidor rodando em http://localhost:8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
