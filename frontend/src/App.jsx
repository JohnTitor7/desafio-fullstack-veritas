import { DragDropContext } from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import { api } from "./api";
import Column from "./components/Column";
import TaskModal from "./components/TaskModal";
import "./App.css";

// As 3 colunas são fixas, como pedido no desafio.
const COLUMNS = [
  { status: "todo", label: "A Fazer", color: "#64748B" },
  { status: "in_progress", label: "Em Progresso", color: "#E8A33D" },
  { status: "done", label: "Concluídas", color: "#2F9E44" },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal: null = fechado. { mode: "create", status } ou { mode: "edit", task }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTasks();
      setTasks(data ?? []);
    } catch {
      setError("Não foi possível conectar ao servidor. O backend está rodando em localhost:8080?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTask(values) {
    if (modal.mode === "edit") {
      const updated = await api.updateTask(modal.task.id, values);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await api.createTask(values);
      setTasks((prev) => [...prev, created]);
    }
    setModal(null);
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(`Excluir a tarefa "${task.title}"?`);
    if (!confirmed) return;

    // Feedback otimista: remove da tela na hora, e desfaz se der erro.
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await api.deleteTask(task.id);
    } catch {
      setError("Não foi possível excluir a tarefa.");
      setTasks(previous);
    }
  }

  // Lógica compartilhada: usada tanto pelas setas (← →) quanto pelo drag-and-drop.
  async function moveTaskToStatus(task, newStatus) {
    if (task.status === newStatus) return;
    const previous = tasks;
    const updatedLocal = { ...task, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedLocal : t)));
    try {
      await api.updateTask(task.id, updatedLocal);
    } catch {
      setError("Não foi possível mover a tarefa.");
      setTasks(previous);
    }
  }

  function handleMoveTask(task, newColumnIndex) {
    const target = COLUMNS[newColumnIndex];
    if (!target) return;
    moveTaskToStatus(task, target.status);
  }

  // Chamada pelo @hello-pangea/dnd quando o usuário solta um card arrastado.
  function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return; // soltou fora de qualquer coluna
    if (source.droppableId === destination.droppableId) return; // mesma coluna, nada muda

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    moveTaskToStatus(task, destination.droppableId);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Mini Kanban</h1>
        <p>Desafio Fullstack — Veritas</p>
      </header>

      {error && (
        <div className="banner banner--error">
          {error}
          <button onClick={loadTasks}>Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <p className="app__loading">Carregando tarefas...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board">
            {COLUMNS.map((column, index) => (
              <Column
                key={column.status}
                column={column}
                columnIndex={index}
                totalColumns={COLUMNS.length}
                tasks={tasks.filter((t) => t.status === column.status)}
                onAddTask={(status) => setModal({ mode: "create", status })}
                onEditTask={(task) => setModal({ mode: "edit", task })}
                onDeleteTask={handleDeleteTask}
                onMoveTask={handleMoveTask}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {modal && (
        <TaskModal
          initialTask={modal.mode === "edit" ? modal.task : null}
          defaultStatus={modal.status}
          onSave={handleSaveTask}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}