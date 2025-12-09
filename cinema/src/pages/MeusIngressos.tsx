import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  preco: number;
}

interface Lanche {
  id: number;
  nome: string;
  preco: number;
}

interface Ingresso {
  id: number;
  sessaoId: number;
  tipo: string; // 'inteira' | 'meia'
  quantidade: number;
  lancheId: number | null;
  lancheQuantidade: number;
  valorTotal: number;
}

interface IngressoDetalhado {
  id: number;
  filmeTitulo: string;
  salaNumero: string;
  dataHora: string;
  tipo: string;
  quantidade: number;
  lancheDescricao: string;
  valorTotal: number;
}

const MeusIngressos: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ingressos, setIngressos] = useState<IngressoDetalhado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resIngressos, resSessoes, resFilmes, resSalas, resLanches] =
          await Promise.all([
            fetch('http://localhost:3000/ingressos'),
            fetch('http://localhost:3000/sessoes'),
            fetch('http://localhost:3000/filmes'),
            fetch('http://localhost:3000/salas'),
            fetch('http://localhost:3000/lanches'),
          ]);

        if (
          !resIngressos.ok ||
          !resSessoes.ok ||
          !resFilmes.ok ||
          !resSalas.ok ||
          !resLanches.ok
        ) {
          throw new Error('Erro ao carregar dados dos ingressos');
        }

        const ingressosRaw: Ingresso[] = await resIngressos.json();
        const sessoes: Sessao[] = await resSessoes.json();
        const filmes: Filme[] = await resFilmes.json();
        const salas: Sala[] = await resSalas.json();
        const lanches: Lanche[] = await resLanches.json();

        const detalhados: IngressoDetalhado[] = ingressosRaw.map((ing) => {
          const sessao = sessoes.find((s) => s.id === ing.sessaoId);
          const filme = sessao
            ? filmes.find((f) => f.id === sessao.filmeId)
            : undefined;
          const sala = sessao
            ? salas.find((s) => s.id === sessao.salaId)
            : undefined;
          const lanche =
            ing.lancheId !== null
              ? lanches.find((l) => l.id === ing.lancheId)
              : undefined;

          const valor = Number.isFinite(ing.valorTotal)
            ? ing.valorTotal
            : 0;

          const lancheDescricao =
            lanche && ing.lancheQuantidade > 0
              ? `${ing.lancheQuantidade}x ${lanche.nome}`
              : 'Nenhum';

          return {
            id: ing.id,
            filmeTitulo: filme ? filme.titulo : 'Filme não encontrado',
            salaNumero: sala ? sala.numeroSala : 'Sala não encontrada',
            dataHora: sessao ? sessao.dataHora : 'Sessão não encontrada',
            tipo: ing.tipo === 'meia' ? 'Meia' : 'Inteira',
            quantidade: ing.quantidade,
            lancheDescricao,
            valorTotal: valor,
          };
        });

        setIngressos(detalhados);
      } catch (err) {
        console.error('Erro ao carregar ingressos:', err);
        alert('Erro ao carregar seus ingressos.');
      } finally {
        setCarregando(false);
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
        <h1>Meus ingressos</h1>
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

      {carregando ? (
        <p>Carregando ingressos...</p>
      ) : ingressos.length === 0 ? (
        <p>Você ainda não possui ingressos registrados.</p>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Histórico de compras</h5>
            <ul className="list-group">
              {ingressos.map((ing) => (
                <li key={ing.id} className="list-group-item">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <div className="mb-2 mb-md-0">
                      <strong>Filme:</strong> {ing.filmeTitulo}
                      <br />
                      <strong>Sala:</strong> {ing.salaNumero}
                      <br />
                      <strong>Data/Hora:</strong> {ing.dataHora}
                    </div>
                    <div className="text-md-end">
                      <strong>Ingressos:</strong> {ing.quantidade}x{' '}
                      {ing.tipo}
                      <br />
                      <strong>Lanche:</strong> {ing.lancheDescricao}
                      <br />
                      <strong>Total:</strong> R${' '}
                      {ing.valorTotal.toFixed(2)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusIngressos;
