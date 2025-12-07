import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

// 🔹 IDs sempre numéricos, json-server gera o id da sessão.
// filmeId e salaId vêm do <select> como string e o z.coerce.number() converte para number.
const sessaoSchema = z.object({
  filmeId: z.coerce
    .number()
    .int()
    .positive({ message: 'Filme é obrigatório' }),

  salaId: z.coerce
    .number()
    .int()
    .positive({ message: 'Sala é obrigatória' }),

  dataHora: z
    .string()
    .min(1, { message: 'Data e hora são obrigatórias' }),

  preco: z.coerce
    .number()
    .positive({ message: 'Preço deve ser maior que zero' })
    .max(500, { message: 'Preço muito alto' }),
});

type SessaoFormData = z.infer<typeof sessaoSchema>;

const Sessoes: React.FC = () => {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SessaoFormData>({
    resolver: zodResolver(sessaoSchema) as any,
  });

  // Carrega filmes, salas e sessões existentes
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resFilmes, resSalas, resSessoes] = await Promise.all([
          fetch('http://localhost:3000/filmes'),
          fetch('http://localhost:3000/salas'),
          fetch('http://localhost:3000/sessoes'),
        ]);

        const filmesData: Filme[] = await resFilmes.json();
        const salasData: Sala[] = await resSalas.json();
        const sessoesData: Sessao[] = await resSessoes.json();

        setFilmes(filmesData);
        setSalas(salasData);
        setSessoes(sessoesData);
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
      }
    };

    carregarDados();
  }, []);

  const onSubmit = async (data: SessaoFormData) => {
    try {
      const resp = await fetch('http://localhost:3000/sessoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 👇 não enviamos id: o json-server cria id numérico automaticamente
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        throw new Error('Erro ao cadastrar sessão');
      }

      const novaSessao: Sessao = await resp.json();
      setSessoes((prev) => [...prev, novaSessao]);

      alert('Sessão cadastrada com sucesso!');
      reset();
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao cadastrar a sessão.');
    }
  };

  const getFilmeTitulo = (id: number) =>
    filmes.find((f) => f.id === id)?.titulo || `ID ${id}`;

  const getSalaNumero = (id: number) =>
    salas.find((s) => s.id === id)?.numeroSala || `ID ${id}`;

  return (
    <div className="container mt-5">
      <h1>Cadastro de Sessões</h1>
      <p className="text-muted">
        Vincule um filme a uma sala, informe a data/hora e o preço do ingresso.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mb-4">
        {/* FILME */}
        <div className="mb-3">
          <label className="form-label">Filme</label>
          <select
            className={`form-control ${errors.filmeId ? 'is-invalid' : ''}`}
            {...register('filmeId')}
          >
            <option value="">Selecione um filme</option>
            {filmes.map((filme) => (
              <option key={filme.id} value={filme.id}>
                {filme.titulo}
              </option>
            ))}
          </select>
          {errors.filmeId && (
            <div className="invalid-feedback">{errors.filmeId.message}</div>
          )}
        </div>

        {/* SALA */}
        <div className="mb-3">
          <label className="form-label">Sala</label>
          <select
            className={`form-control ${errors.salaId ? 'is-invalid' : ''}`}
            {...register('salaId')}
          >
            <option value="">Selecione uma sala</option>
            {salas.map((sala) => (
              <option key={sala.id} value={sala.id}>
                {sala.numeroSala}
              </option>
            ))}
          </select>
          {errors.salaId && (
            <div className="invalid-feedback">{errors.salaId.message}</div>
          )}
        </div>

        {/* DATA E HORA */}
        <div className="mb-3">
          <label className="form-label">Data e Hora</label>
          <input
            type="datetime-local"
            className={`form-control ${errors.dataHora ? 'is-invalid' : ''}`}
            {...register('dataHora')}
          />
          {errors.dataHora && (
            <div className="invalid-feedback">{errors.dataHora.message}</div>
          )}
        </div>

        {/* PREÇO */}
        <div className="mb-3">
          <label className="form-label">Preço do Ingresso (R$)</label>
          <input
            type="number"
            step="0.01"
            className={`form-control ${errors.preco ? 'is-invalid' : ''}`}
            {...register('preco')}
          />
          {errors.preco && (
            <div className="invalid-feedback">{errors.preco.message}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Cadastrar Sessão'}
        </button>
      </form>

      <h2>Sessões cadastradas</h2>
      {sessoes.length === 0 ? (
        <p className="text-muted">Nenhuma sessão cadastrada ainda.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Filme</th>
              <th>Sala</th>
              <th>Data e Hora</th>
              <th>Preço (R$)</th>
            </tr>
          </thead>
          <tbody>
            {sessoes.map((sessao) => (
              <tr key={sessao.id}>
                <td>{getFilmeTitulo(sessao.filmeId)}</td>
                <td>{getSalaNumero(sessao.salaId)}</td>
                <td>{sessao.dataHora}</td>
                <td>{Number(sessao.preco).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Sessoes;
