const API_URL = "http://localhost:8080";

// Função auxiliar: faz o fetch e já trata erro de forma padronizada.
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }

  if (res.status === 204) return null; // DELETE não retorna corpo
  return res.json();
}

export const api = {
  listTasks: () => request("/tasks"),

  createTask: (task) =>
    request("/tasks", { method: "POST", body: JSON.stringify(task) }),

  updateTask: (id, task) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),

  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
