import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface Sessao {
  id: number;
  filmeId: number;
  salaId: number;
  dataHora: string;
  preco: number;
}

interface Filme {
  id: number;
  titulo: string;
}

interface Sala {
  id: number;
  numeroSala: string;
  capacidade: number;
}

interface Lanche {
  id: number;
  nome: string;
  preco: number;
}

// Ingressos já registrados no json-server
interface IngressoExistente {
  id: number;
  sessaoId: number;
  tipo: string;
  quantidade: number;
  lancheId: number | null;
  lancheQuantidade: number;
  valorTotal: number;
}

// Esquema de validação do ingresso (sem id – json-server gera)
const ingressoSchema = z
  .object({
    tipo: z.enum(['inteira', 'meia']),
    quantidade: z.coerce
      .number({ message: 'Quantidade deve ser um número' })
      .int({ message: 'Quantidade deve ser inteira' })
      .positive({ message: 'Quantidade deve ser maior que zero' })
      .max(20, { message: 'Quantidade máxima por compra é 20' }),

    lancheId: z
      .string()
      .optional()
      .refine(
        (v) => v === undefined || v === '' || !Number.isNaN(Number(v)),
        { message: 'Lanche inválido' },
      )
      .transform((v) =>
        v === undefined || v === '' ? undefined : Number(v),
      ),

    lancheQuantidade: z.coerce
      .number({
        message: 'Quantidade de lanche deve ser um número',
      })
      .int({ message: 'Quantidade de lanche deve ser inteira' })
      .positive({ message: 'Quantidade de lanche deve ser maior que zero' })
      .max(20, { message: 'Quantidade máxima de lanche é 20' })
      .optional(),
  })
  // Se tiver lancheId, exige lancheQuantidade
  .refine(
    (data) =>
      data.lancheId === undefined || data.lancheQuantidade !== undefined,
    {
      path: ['lancheQuantidade'],
      message: 'Informe a quantidade do lanche',
    },
  );

type IngressoFormData = z.infer<typeof ingressoSchema>;

const ComprarIngresso: React.FC = () => {
  const { sessaoId } = useParams();
  const navigate = useNavigate();

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [filme, setFilme] = useState<Filme | null>(null);
  const [sala, setSala] = useState<Sala | null>(null);
  const [lanches, setLanches] = useState<Lanche[]>([]);
  const [carregando, setCarregando] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IngressoFormData>({
    resolver: zodResolver(ingressoSchema) as any,
    defaultValues: {
      tipo: 'inteira',
      quantidade: 1,
      lancheId: undefined,
      lancheQuantidade: 1,
    },
  });

  const tipo = watch('tipo');
  const quantidade = watch('quantidade') || 0;
  const lancheIdWatch = watch('lancheId');
  const lancheQuantidade = watch('lancheQuantidade') || 0;

  // Normaliza o lancheId pra número ou undefined
  const lancheId =
    typeof lancheIdWatch === 'string'
      ? (Number(lancheIdWatch) || undefined)
      : lancheIdWatch ?? undefined;

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (!sessaoId) return;

        const resSessao = await fetch(
          `http://localhost:3000/sessoes/${sessaoId}`,
        );
        if (!resSessao.ok) throw new Error('Sessão não encontrada');

        const sessaoData: Sessao = await resSessao.json();
        setSessao(sessaoData);

        const [resFilme, resSala, resLanches] = await Promise.all([
          fetch(`http://localhost:3000/filmes/${sessaoData.filmeId}`),
          fetch(`http://localhost:3000/salas/${sessaoData.salaId}`),
          fetch('http://localhost:3000/lanches'),
        ]);

        if (!resFilme.ok || !resSala.ok) {
          throw new Error('Filme ou sala não encontrados');
        }

        const filmeData: Filme = await resFilme.json();
        const salaData: Sala = await resSala.json();

        let lanchesData: Lanche[] = [];
        if (resLanches.ok) {
          const json = await resLanches.json();
          lanchesData = Array.isArray(json) ? json : [];
        } else {
          console.warn('Não foi possível carregar lanches.');
        }

        setFilme(filmeData);
        setSala(salaData);
        setLanches(lanchesData);
      } catch (error) {
        console.error('Erro ao carregar dados da compra:', error);
        alert('Erro ao carregar dados da sessão.');
        navigate('/cliente');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [sessaoId, navigate]);

  const calcularValorTotal = () => {
    if (!sessao) return 0;
    const fator = tipo === 'meia' ? 0.5 : 1;
    const valorIngressos = sessao.preco * quantidade * fator;

    const lancheSelecionado =
      lancheId !== undefined
        ? lanches.find((l) => l.id === lancheId)
        : undefined;

    const qtdLanche = lancheId !== undefined ? lancheQuantidade || 0 : 0;
    const valorLanche = lancheSelecionado
      ? lancheSelecionado.preco * qtdLanche
      : 0;

    return valorIngressos + valorLanche;
  };

  const onSubmit = async (data: IngressoFormData) => {
    try {
      if (!sessao || !sala) {
        alert('Sessão ou sala inválida');
        return;
      }

      // 🔹 1) Verificar capacidade da sala antes de registrar a compra
      const resIngressos = await fetch(
        `http://localhost:3000/ingressos?sessaoId=${sessao.id}`,
      );
      if (!resIngressos.ok) {
        throw new Error('Erro ao verificar lotação da sessão');
      }

      const ingressosSessao: IngressoExistente[] =
        await resIngressos.json();

      const totalJaVendidos = ingressosSessao.reduce(
        (total, ing) => total + (ing.quantidade || 0),
        0,
      );

      const capacidadeSala =
        typeof sala.capacidade === 'number' ? sala.capacidade : 0;

      const disponiveis = capacidadeSala - totalJaVendidos;

      if (disponiveis <= 0) {
        alert(
          'Esta sessão está lotada. Não há mais lugares disponíveis para venda.',
        );
        return;
      }

      if (data.quantidade > disponiveis) {
        alert(
          `Não há lugares suficientes nesta sessão.\n` +
            `Lugares disponíveis: ${disponiveis}\n` +
            `Quantidade solicitada: ${data.quantidade}`,
        );
        return;
      }

      // 🔹 2) Se passou na verificação, calcula valor e registra a compra
      const valorTotal = calcularValorTotal();

      const resp = await fetch('http://localhost:3000/ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          sessaoId: sessao.id,
          tipo: data.tipo,
          quantidade: data.quantidade,
          lancheId: lancheId ?? null,
          lancheQuantidade:
            lancheId !== undefined ? data.lancheQuantidade ?? 1 : 0,
          valorTotal,
        }),
      });

      if (!resp.ok) throw new Error('Erro ao registrar ingresso');

      alert(
        `Compra realizada com sucesso! Valor total: R$ ${valorTotal.toFixed(
          2,
        )}`,
      );
      navigate('/cliente');
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar a compra.');
    }
  };

  if (carregando) {
    return (
      <div className="container mt-5">
        <p>Carregando dados da sessão...</p>
      </div>
    );
  }

  if (!sessao || !filme || !sala) {
    return (
      <div className="container mt-5">
        <p>Dados da sessão não encontrados.</p>
      </div>
    );
  }

  const valorTotal = calcularValorTotal();
  const lancheSelecionado =
    lancheId !== undefined
      ? lanches.find((l) => l.id === lancheId)
      : undefined;
  const qtdLancheResumo =
    lancheId !== undefined && lancheSelecionado ? lancheQuantidade || 0 : 0;
  const valorLancheResumo = lancheSelecionado
    ? lancheSelecionado.preco * qtdLancheResumo
    : 0;

  const capacidadeSala =
    typeof sala.capacidade === 'number' ? sala.capacidade : 0;

  return (
    <div className="container mt-5">
      <h1>Comprar Ingresso</h1>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">{filme.titulo}</h5>
          <p className="card-text">
            <strong>Sala:</strong> {sala.numeroSala}
            <br />
            <strong>Capacidade da sala:</strong> {capacidadeSala} lugares
            <br />
            <strong>Data/Hora:</strong> {sessao.dataHora}
            <br />
            <strong>Preço base:</strong> R$ {sessao.preco.toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* TIPO DE INGRESSO */}
        <div className="mb-3">
          <label className="form-label">Tipo de ingresso</label>
          <div>
            <div className="form-check form-check-inline">
              <input
                type="radio"
                id="tipoInteira"
                value="inteira"
                className="form-check-input"
                {...register('tipo')}
              />
              <label className="form-check-label" htmlFor="tipoInteira">
                Inteira (100%)
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                type="radio"
                id="tipoMeia"
                value="meia"
                className="form-check-input"
                {...register('tipo')}
              />
              <label className="form-check-label" htmlFor="tipoMeia">
                Meia (50%)
              </label>
            </div>
          </div>
          {errors.tipo && (
            <div className="text-danger">{errors.tipo.message}</div>
          )}
        </div>

        {/* QUANTIDADE DE INGRESSOS */}
        <div className="mb-3">
          <label className="form-label">Quantidade de ingressos</label>
          <input
            type="number"
            className={`form-control ${
              errors.quantidade ? 'is-invalid' : ''
            }`}
            {...register('quantidade')}
            min={1}
            max={20}
          />
          {errors.quantidade && (
            <div className="invalid-feedback">
              {errors.quantidade.message}
            </div>
          )}
        </div>

        {/* LANCHE */}
        <div className="mb-3">
          <label className="form-label">Lanche (opcional)</label>
          <select
            className={`form-control ${
              errors.lancheId ? 'is-invalid' : ''
            }`}
            {...register('lancheId')}
          >
            <option value="">Nenhum</option>
            {Array.isArray(lanches) &&
              lanches.map((lanche) => (
                <option key={lanche.id} value={lanche.id}>
                  {lanche.nome} - R$ {lanche.preco.toFixed(2)}
                </option>
              ))}
          </select>
          {errors.lancheId && (
            <div className="invalid-feedback">
              {errors.lancheId.message as string}
            </div>
          )}

          {/* QUANTIDADE DE LANCHE (só faz sentido se tiver lanche selecionado) */}
          {lancheId !== undefined && (
            <div className="mt-3">
              <label className="form-label">Quantidade de lanches</label>
              <input
                type="number"
                className={`form-control ${
                  errors.lancheQuantidade ? 'is-invalid' : ''
                }`}
                {...register('lancheQuantidade')}
                min={1}
                max={20}
              />
              {errors.lancheQuantidade && (
                <div className="invalid-feedback">
                  {errors.lancheQuantidade.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RESUMO */}
        <div className="mb-3">
          <h5>Resumo</h5>
          <p>
            Tipo:{' '}
            <strong>
              {tipo === 'meia' ? 'Meia (50%)' : 'Inteira (100%)'}
            </strong>
            <br />
            Ingressos: <strong>{quantidade}</strong>
            <br />
            Lanche:{' '}
            <strong>
              {lancheSelecionado
                ? `${qtdLancheResumo}x ${lancheSelecionado.nome} (R$ ${valorLancheResumo.toFixed(
                    2,
                  )})`
                : 'Nenhum'}
            </strong>
            <br />
            Valor total:{' '}
            <strong>R$ {valorTotal.toFixed(2)}</strong>
          </p>
        </div>

        <button className="btn btn-success" disabled={isSubmitting}>
          {isSubmitting ? 'Processando...' : 'Confirmar compra'}
        </button>
      </form>
    </div>
  );
};

export default ComprarIngresso;
