// src/components/LancheForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const lancheSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  preco: z.coerce
    .number({ message: 'Preço deve ser um número' })
    .positive({ message: 'Preço deve ser maior que zero' })
    .max(500, { message: 'Preço máximo é R$ 500,00' }),
});

export type LancheFormData = z.infer<typeof lancheSchema>;

export interface Lanche {
  id: number;
  nome: string;
  preco: number;
}

interface LancheFormProps {
  onSucesso?: (novoLanche: Lanche) => void;
}

const LancheForm: React.FC<LancheFormProps> = ({ onSucesso }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LancheFormData>({
    resolver: zodResolver(lancheSchema) as any,
  });

  const onSubmit = async (data: LancheFormData) => {
    try {
      const resp = await fetch('http://localhost:3000/lanches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // json-server cria id int automaticamente
        body: JSON.stringify(data),
      });

      if (!resp.ok) throw new Error('Erro ao cadastrar lanche');

      const novoLanche: Lanche = await resp.json();
      alert('Lanche cadastrado com sucesso!');
      reset();
      if (onSucesso) onSucesso(novoLanche);
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar lanche');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mb-4">
      <div className="mb-3">
        <label className="form-label">Nome do lanche</label>
        <input
          className={`form-control ${errors.nome ? 'is-invalid' : ''}`}
          {...register('nome')}
        />
        {errors.nome && (
          <div className="invalid-feedback">{errors.nome.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Preço (R$)</label>
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

      <button className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Cadastrar Lanche'}
      </button>
    </form>
  );
};

export default LancheForm;
