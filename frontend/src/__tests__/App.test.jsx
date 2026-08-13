import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";
import { api } from "../api";

// Substitui o módulo real de API por um "dublê" controlado pelo teste,
// assim não fazemos requisições HTTP de verdade nos testes.
vi.mock("../api", () => ({
  api: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

describe("App", () => {
  it("renderiza as 3 colunas fixas e distribui as tarefas por status", async () => {
    api.listTasks.mockResolvedValue([
      { id: "1", title: "Fazer isso", status: "todo" },
      { id: "2", title: "Fazendo aquilo", status: "in_progress" },
      { id: "3", title: "Já feito", status: "done" },
    ]);

    render(<App />);

    expect(await screen.findByText("A Fazer")).toBeInTheDocument();
    expect(screen.getByText("Em Progresso")).toBeInTheDocument();
    expect(screen.getByText("Concluídas")).toBeInTheDocument();

    expect(screen.getByText("Fazer isso")).toBeInTheDocument();
    expect(screen.getByText("Fazendo aquilo")).toBeInTheDocument();
    expect(screen.getByText("Já feito")).toBeInTheDocument();
  });

  it("mostra um banner de erro quando a API falha ao carregar", async () => {
    api.listTasks.mockRejectedValue(new Error("network error"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível conectar ao servidor/)).toBeInTheDocument();
    });
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });
});