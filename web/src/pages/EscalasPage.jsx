import { useEffect, useMemo, useState } from "react";

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function EscalasPage() {
  // estado do formulário
  const [militarId, setMilitarId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  // persistidos
  const [militares, setMilitares] = useState([]);
  const [escalas, setEscalas] = useState([]);

  // carregar LS
  useEffect(() => {
    setMilitares(loadLS("militares", []));
    setEscalas(loadLS("escalas", []));
  }, []);

  // lista do dia
  const escalasDoDia = useMemo(
    () => escalas.filter((e) => e.data === data),
    [escalas, data]
  );

  // lista geral (ordenada por data crescente, depois horário)
  const escalasGeraisOrdenadas = useMemo(() => {
    const byDateTime = [...escalas].sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return hhmmToMinutes(a.horario_inicio) - hhmmToMinutes(b.horario_inicio);
    });
    return byDateTime;
  }, [escalas]);

  function validar() {
    if (!militarId || !data || !inicio || !fim) {
      alert("Preencha militar, data, início e fim.");
      return false;
    }
    if (hhmmToMinutes(inicio) >= hhmmToMinutes(fim)) {
      alert("Horário inválido: início deve ser menor que fim.");
      return false;
    }
    // 1 escala por militar/dia
    const jaTem = escalas.some(
      (e) => e.militar_id === Number(militarId) && e.data === data
    );
    if (jaTem) {
      alert(`Militar já possui escala no dia ${data}`);
      return false;
    }
    return true;
  }

  function handleCadastrar(e) {
    e.preventDefault();
    if (!validar()) return;

    const nova = {
      id: Date.now(),
      militar_id: Number(militarId),
      data,
      horario_inicio: inicio,
      horario_fim: fim,
    };

    const prox = [...escalas, nova];
    setEscalas(prox);
    saveLS("escalas", prox);
    setInicio("");
    setFim("");
  }

  function militarLabel(id) {
    const m = militares.find((x) => x.id === id);
    // ajuste o campo para 'posto' ou 'posto_grad' conforme seu cadastro
    return m ? `${m.nome} (${m.posto || m.posto_grad || ""})` : `#${id}`;
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Cadastro de Escalas</h2>

      <form
        onSubmit={handleCadastrar}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <select value={militarId} onChange={(e) => setMilitarId(e.target.value)}>
          <option value="">Selecione o militar</option>
          {militares.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} ({m.posto || m.posto_grad || ""})
            </option>
          ))}
        </select>

        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
        <button type="submit">Cadastrar</button>
      </form>

      <h3>Escalas do dia {data}</h3>
      <ul>
        {escalasDoDia.length === 0 && <li>Nenhuma escala para este dia.</li>}
        {escalasDoDia.map((e) => (
          <li key={e.id}>
            {militarLabel(e.militar_id)} — {e.horario_inicio} às {e.horario_fim}
          </li>
        ))}
      </ul>

      <hr style={{ margin: "24px 0" }} />

      <h3>Todas as escalas (geral)</h3>
      <ul>
        {escalasGeraisOrdenadas.length === 0 && <li>Nenhuma escala cadastrada.</li>}
        {escalasGeraisOrdenadas.map((e) => (
          <li key={e.id}>
            {e.data} — {militarLabel(e.militar_id)} — {e.horario_inicio} às {e.horario_fim}
          </li>
        ))}
      </ul>
    </div>
  );
}
