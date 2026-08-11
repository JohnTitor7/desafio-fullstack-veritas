// Um cartão de tarefa. Recebe a tarefa e funções (callbacks) para
// editar, excluir e mover — quem decide O QUE fazer é o componente pai (App).
export default function TaskCard({ task, canMoveLeft, canMoveRight, onEdit, onDelete, onMove }) {
  return (
    <div className="task-card">
      <div className="task-card__body">
        <p className="task-card__title">{task.title}</p>
        {task.description && (
          <p className="task-card__description">{task.description}</p>
        )}
      </div>

      <div className="task-card__actions">
        <button
          className="icon-btn"
          title="Mover para a coluna anterior"
          disabled={!canMoveLeft}
          onClick={() => onMove(-1)}
        >
          ←
        </button>
        <button
          className="icon-btn"
          title="Mover para a próxima coluna"
          disabled={!canMoveRight}
          onClick={() => onMove(1)}
        >
          →
        </button>
        <button className="icon-btn" title="Editar" onClick={onEdit}>
          ✎
        </button>
        <button className="icon-btn icon-btn--danger" title="Excluir" onClick={onDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}
