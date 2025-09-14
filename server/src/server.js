import express from "express";
import cors from "cors";
import prisma from "./db.js";
import { MilitarCreateSchema, safeParse } from "./validators.js";

const app = express();
app.use(cors());
app.use(express.json());

// rota de saúde (teste rápido)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// rota de teste do banco
app.get("/db/health", async (req, res) => {
  try {
    const militarCount = await prisma.militar.count();
    res.json({ db: "ok", militar_count: militarCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "DB_ERROR", message: "Falha ao consultar o banco" });
  }
});

// criar militar
app.post("/militares", async (req, res) => {
  // validação dos dados recebidos
  const parsed = safeParse(MilitarCreateSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }

  try {
    const militar = await prisma.militar.create({
      data: parsed.data,
    });
    res.status(201).json(militar);
  } catch (e) {
    if (e.code === "P2002") {
      // erro de chave única (matricula duplicada)
      return res.status(409).json({
        error: "CONFLICT",
        message: `Matrícula já existe: ${parsed.data.matricula}`,
      });
    }
    console.error(e);
    res.status(500).json({ error: "SERVER_ERROR", message: "Erro ao criar militar" });
  }
});

// listar militares (todos)
app.get("/militares", async (req, res) => {
  try {
    const militares = await prisma.militar.findMany({
      orderBy: { id: "asc" },
    });
    res.json(militares);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "SERVER_ERROR", message: "Erro ao listar militares" });
  }
});

// detalhar militar por id
app.get("/militares/:id", async (req, res) => {
  // extrai o param :id
  const { id } = req.params;

  // converte para número inteiro
  const militarId = Number(id);

  // validação simples do id
  if (!Number.isInteger(militarId) || militarId <= 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Parametro :id deve ser inteiro positivo",
    });
  }

  try {
    const militar = await prisma.militar.findUnique({
      where: { id: militarId },
    });

    if (!militar) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Militar id ${militarId} não encontrado`,
      });
    }

    res.json(militar);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "SERVER_ERROR", message: "Erro ao buscar militar" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[API] Rodando em http://localhost:${PORT}`);
});
