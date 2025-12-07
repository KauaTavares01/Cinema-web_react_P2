import React, { useEffect, useState } from 'react';
import SalaForm from '../components/SalaForm';

interface Sala {
  id: number;
  numeroSala: number;
  capacidade: number;
}

const Salas: React.FC = () => {
  const [salas, setSalas] = useState<Sala[]>([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const resp = await fetch('http://localhost:3000/salas');
        const data = await resp.json();
        setSalas(data);
      } catch (err) {
        console.error('Erro ao buscar salas:', err);
      }
    };
    carregar();
  }, []);

  const handleNovaSala = (novaSala: Sala) => {
    setSalas((prev) => [...prev, novaSala]);
  };

  return (
    <div className="container mt-5">
      <h1>Salas</h1>
      <p className="text-muted">Gerencie as salas do cinema.</p>

      <SalaForm on-Sucesso={handleNovaSala} />

      <h2>Salas cadastradas</h2>
      {salas.length === 0 ? (
        <p>Nenhuma sala cadastrada.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Número</th>
              <th>Capacidade</th>
            </tr>
          </thead>
          <tbody>
            {salas.map((sala) => (
              <tr key={sala.id}>
                <td>{sala.numeroSala}</td>
                <td>{sala.capacidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Salas;
