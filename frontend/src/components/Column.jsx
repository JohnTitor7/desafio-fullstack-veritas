import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks, columnIndex, totalColumns, onAddTask, onEditTask, onDeleteTask, onMoveTask }) {
  return (
    <section className="column">
      <header className="column__header">
        <span className="column__dot" style={{ background: column.color }} />
        <h2 className="column__title">{column.label}</h2>
        <span className="column__count">{tasks.length}</span>
      </header>

      <Droppable droppableId={column.status}>
        {(provided, snapshot) => (
          <div
            className={`column__list${snapshot.isDraggingOver ? " column__list--over" : ""}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && (
              <p className="column__empty">Nenhuma tarefa aqui ainda.</p>
            )}
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <TaskCard
                    task={task}
                    canMoveLeft={columnIndex > 0}
                    canMoveRight={columnIndex < totalColumns - 1}
                    onEdit={() => onEditTask(task)}
                    onDelete={() => onDeleteTask(task)}
                    onMove={(direction) => onMoveTask(task, columnIndex + direction)}
                    dragRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    isDragging={dragSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button className="column__add" onClick={() => onAddTask(column.status)}>
        + Nova tarefa
      </button>
    </section>
  );
}