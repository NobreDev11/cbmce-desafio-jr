import React, { useState, useEffect } from "react";

function MilitaresPage() {
  const [militares, setMilitares] = useState([]);
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("");

  // Carregar militares do localStorage quando abrir a página
  useEffect(() => {
    const dadosSalvos = localStorage.getItem("militares");
    if (dadosSalvos) {
      setMilitares(JSON.parse(dadosSalvos));
    }
  }, []);

  // Função para cadastrar
  const handleCadastrar = () => {
    if (!nome || !posto) return;

    const novoMilitar = {
      id: Date.now(), // gera um ID único
      nome,
      posto,
    };

    const listaAtualizada = [...militares, novoMilitar];
    setMilitares(listaAtualizada);

    // Salvar no localStorage
    localStorage.setItem("militares", JSON.stringify(listaAtualizada));

    setNome("");
    setPosto("");
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Cadastro de Militares</h2>
      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <input
        type="text"
        placeholder="Posto/Graduação"
        value={posto}
        onChange={(e) => setPosto(e.target.value)}
      />
      <button onClick={handleCadastrar}>Cadastrar</button>

      <h3>Lista de Militares</h3>
      <ul>
        {militares.map((militar) => (
          <li key={militar.id}>
            {militar.nome} — {militar.posto}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MilitaresPage;
