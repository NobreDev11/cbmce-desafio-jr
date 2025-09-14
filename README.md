# cbmce-desafio-jr

# CBMCE - Desafio Fullstack Júnior

## Estrutura
- server/ → API Node (Express + Prisma + SQLite)
- web/ → Front-end React (Vite + React Query)

## Como executar (local)
### Backend (server)
1. `cd server`
2. `npm install`
3. (primeira vez) `npx prisma migrate dev --name init`
4. `npm run dev`  → API em `http://localhost:3001`

### Frontend (web)
1. `cd web`
2. `npm install`
3. `npm run dev` → Vite em `http://localhost:5173`

