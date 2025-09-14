import express from "express";
import cors from "cors";

import prisma from "./db.js";
import { MilitarCreateSchema, EscalaCreateSchema, safeParse } from "./validators.js";

const app = express();
app.use(cors());
app.use(express.json());

// saúde básica
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// saúde do banco (conta militares)
app.get("/db/health", async (req, res) => {
  try {
    const militarCount = await prisma.militar.count();
    res.json({ db: "ok", militar_count: militarCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "DB_ERROR", message: "Falha ao consultar o banco" });
  }
});

/* =========================
 *      MILITARES
 * ========================= */

// criar militar
app.post("/militares", async (req, res) => {
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
  const { id } = req.params;
  const militarId = Number(id);

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

/* =========================
 *        ESCALAS
 * ========================= */

// listar escalas
// - Se vier ?data=YYYY-MM-DD  => lista do dia (com dados do militar)
// - Senão, lista geral paginada: ?page=1&limit=10
app.get("/escalas", async (req, res) => {
  const { data, page, limit } = req.query;

  // Caso 1: lista do dia
  if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    try {
      const escalas = await prisma.escala.findMany({
        where: { data },
        include: { militar: true },
        orderBy: { horario_inicio: "asc" },
      });
      return res.json(escalas);
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ error: "SERVER_ERROR", message: "Erro ao listar escalas do dia" });
    }
  }

  // Caso 2: lista geral com paginação
  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 10);

  if (!Number.isInteger(pageNum) || pageNum <= 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "page deve ser inteiro positivo",
    });
  }
  if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "limit deve ser inteiro entre 1 e 100",
    });
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const [items, total] = await Promise.all([
      prisma.escala.findMany({
        skip,
        take: limitNum,
        include: { militar: true },
        orderBy: [{ data: "asc" }, { horario_inicio: "asc" }],
      }),
      prisma.escala.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      items,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Erro ao listar escalas" });
  }
});


// listar escalas por dia: GET /escalas?data=YYYY-MM-DD
app.get("/escalas", async (req, res) => {
  const { data, page, limit } = req.query;

  // se veio 'data', tratamos como "lista do dia"
  if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    try {
      const escalas = await prisma.escala.findMany({
        where: { data },
        include: { militar: true }, // traz dados do militar junto
        orderBy: { horario_inicio: "asc" },
      });
      return res.json(escalas);
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ error: "SERVER_ERROR", message: "Erro ao listar escalas do dia" });
    }
  }

  // se NÃO veio 'data', caímos na listagem geral (paginada)
  // (implementaremos no próximo micro-passo)
  return res.status(400).json({
    error: "VALIDATION_ERROR",
    message:
      "Use ?data=YYYY-MM-DD para listar por dia, ou aguarde o próximo passo para paginação geral",
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[API] Rodando em http://localhost:${PORT}`);
});

