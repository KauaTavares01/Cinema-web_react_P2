// src/pages/Lanches.tsx
import React, { useEffect, useState } from 'react';
import LancheForm from '../components/LancheForm';
import type { Lanche } from '../components/LancheForm';

const Lanches: React.FC = () => {
  const [lanches, setLanches] = useState<Lanche[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const resp = await fetch('http://localhost:3000/lanches');
        if (!resp.ok) {
          throw new Error('Erro ao carregar lanches');
        }
        const data: Lanche[] = await resp.json();
        setLanches(data);
      } catch (err) {
        console.error('Erro ao carregar lanches:', err);
        alert('Erro ao carregar lanches.');
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  const handleSucesso = (novoLanche: Lanche) => {
    setLanches((prev) => [...prev, novoLanche]);
  };

  return (
    <div className="container mt-5">
      <h1>Cadastro de Lanches</h1>
      <p className="text-muted">
        Cadastre os lanches disponíveis para compra junto com o ingresso.
      </p>

      {/* Formulário de cadastro */}
      <LancheForm onSucesso={handleSucesso} />

      <h2 className="mt-4">Lanches cadastrados</h2>

      {carregando ? (
        <p className="text-muted">Carregando lanches...</p>
      ) : lanches.length === 0 ? (
        <p className="text-muted">Nenhum lanche cadastrado ainda.</p>
      ) : (
        <table className="table table-striped mt-2">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço (R$)</th>
            </tr>
          </thead>
          <tbody>
            {lanches.map((lanche) => (
              <tr key={lanche.id}>
                <td>{lanche.nome}</td>
                <td>{lanche.preco.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Lanches;
