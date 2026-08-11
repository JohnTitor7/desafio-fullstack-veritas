import { useState } from "react";

const STATUS_LABELS = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluídas",
};

// Modal usado tanto para CRIAR quanto para EDITAR.
// Se `initialTask` vier preenchido, é edição; se não, é criação.
export default function TaskModal({ initialTask, defaultStatus, onSave, onClose }) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [status, setStatus] = useState(initialTask?.status ?? defaultStatus);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initialTask);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), status });
    } catch (err) {
      setError(err.message || "Não foi possível salvar a tarefa.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEditing ? "Editar tarefa" : "Nova tarefa"}</h3>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Título *</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Configurar o banco de dados"
            />
          </label>

          <label className="field">
            <span>Descrição (opcional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
