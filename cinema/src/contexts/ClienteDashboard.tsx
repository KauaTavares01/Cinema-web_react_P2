import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface Filme {
  id: number;
  titulo: string;
}

interface Sala {
  id: number;
  numeroSala: string;
}

interface Sessao {
  id: number;
  filmeId: number;
  salaId: number;
  dataHora: string;
  preco?: number;
}

interface SessaoDetalhada {
  id: number;
  filmeTitulo: string;
  salaNumero: string;
  dataHora: string;
  preco: number;
}

const ClienteDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessoes, setSessoes] = useState<SessaoDetalhada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resFilmes, resSalas, resSessoes] = await Promise.all([
          fetch('http://localhost:3000/filmes'),
          fetch('http://localhost:3000/salas'),
          fetch('http://localhost:3000/sessoes'),
        ]);

        const filmes: Filme[] = await resFilmes.json();
        const salas: Sala[] = await resSalas.json();
        const sessoesRaw: Sessao[] = await resSessoes.json();

        const detalhes: SessaoDetalhada[] = sessoesRaw.map((sessao) => {
          const filme = filmes.find((f) => f.id === sessao.filmeId);
          const sala = salas.find((s) => s.id === sessao.salaId);
          const precoNumero = Number(
            sessao.preco !== undefined && sessao.preco !== null
              ? sessao.preco
              : 0,
          );

          return {
            id: sessao.id,
            filmeTitulo: filme ? filme.titulo : 'Filme não encontrado',
            salaNumero: sala ? sala.numeroSala : 'Sala não encontrada',
            dataHora: sessao.dataHora,
            preco: isNaN(precoNumero) ? 0 : precoNumero,
          };
        });

        setSessoes(detalhes);
      } catch (err) {
        console.error('Erro ao carregar sessões:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'cliente') {
    return (
      <div className="container mt-4">
        <p>Acesso não autorizado.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Área do Cliente</h1>
        <div>
          <span className="me-3">
            Logado como: <strong>Cliente</strong>
          </span>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <p>Carregando sessões...</p>
      ) : sessoes.length === 0 ? (
        <p>Não há sessões disponíveis.</p>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Sessões disponíveis</h5>
            <ul className="list-group">
              {sessoes.map((s) => {
                const precoSeguro =
                  typeof s.preco === 'number' && !isNaN(s.preco) ? s.preco : 0;

                return (
                  <li key={s.id} className="list-group-item">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                      <div className="mb-2 mb-md-0">
                        <strong>Filme:</strong> {s.filmeTitulo}
                        <br />
                        <strong>Sala:</strong> {s.salaNumero}
                        <br />
                        <strong>Data/Hora:</strong> {s.dataHora}
                      </div>
                      <div className="text-md-end">
                        <strong>Preço:</strong> R${' '}
                        {precoSeguro.toFixed(2)}
                        <br />
                        <Link
                          to={`/comprar-ingresso/${s.id}`}
                          className="btn btn-sm btn-success mt-2"
                        >
                          Comprar ingresso
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDashboard;
