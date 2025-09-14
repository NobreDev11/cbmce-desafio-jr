import { z } from "zod";

// Esquema para criar Militar
export const MilitarCreateSchema = z.object({
  matricula: z.string().trim().min(1, "matricula obrigatória"),
  nome: z.string().trim().min(1, "nome obrigatório"),
  posto_grad: z.string().trim().min(1, "posto_grad obrigatório"),
});

// Função utilitária: valida e retorna { success, data | error }
export function safeParse(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Mapeia erros do Zod para um objeto mais simples
  return {
    success: false,
    error: {
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: result.error.flatten(),
    },
  };
}
