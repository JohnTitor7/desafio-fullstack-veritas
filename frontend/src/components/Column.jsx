import TaskCard from "./TaskCard";

// Uma coluna do Kanban (ex: "A Fazer"). Só exibe as tarefas que
// já vieram filtradas por status — quem filtra é o App.
export default function Column({ column, tasks, columnIndex, totalColumns, onAddTask, onEditTask, onDeleteTask, onMoveTask }) {
  return (
    <section className="column">
      <header className="column__header">
        <span className="column__dot" style={{ background: column.color }} />
        <h2 className="column__title">{column.label}</h2>
        <span className="column__count">{tasks.length}</span>
      </header>

      <div className="column__list">
        {tasks.length === 0 && (
          <p className="column__empty">Nenhuma tarefa aqui ainda.</p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            canMoveLeft={columnIndex > 0}
            canMoveRight={columnIndex < totalColumns - 1}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
            onMove={(direction) => onMoveTask(task, columnIndex + direction)}
          />
        ))}
      </div>

      <button className="column__add" onClick={() => onAddTask(column.status)}>
        + Nova tarefa
      </button>
    </section>
  );
}
