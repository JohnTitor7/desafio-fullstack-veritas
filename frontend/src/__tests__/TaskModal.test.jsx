import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskModal from "../components/TaskModal";

describe("TaskModal", () => {
  it("mostra erro ao tentar salvar sem título", () => {
    const onSave = vi.fn();
    render(<TaskModal defaultStatus="todo" onSave={onSave} onClose={() => {}} />);

    fireEvent.click(screen.getByText("Salvar"));

    expect(screen.getByText("O título é obrigatório.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("chama onSave com os dados preenchidos", async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<TaskModal defaultStatus="todo" onSave={onSave} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Configurar o banco de dados"), {
      target: { value: "Nova tarefa de teste" },
    });
    fireEvent.click(screen.getByText("Salvar"));

    expect(onSave).toHaveBeenCalledWith({
      title: "Nova tarefa de teste",
      description: "",
      status: "todo",
    });
  });

  it("pré-preenche os campos quando está editando uma tarefa existente", () => {
    const task = { id: "1", title: "Tarefa existente", description: "desc", status: "done" };
    render(<TaskModal initialTask={task} onSave={() => {}} onClose={() => {}} />);

    expect(screen.getByDisplayValue("Tarefa existente")).toBeInTheDocument();
    expect(screen.getByText("Editar tarefa")).toBeInTheDocument();
  });
});