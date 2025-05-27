import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pedidosService from '../../../services/clientes/pedidos';
import './finalizarPedido.css';

const FinalizarPedido = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    observacoes: ''
  });
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const salvo = localStorage.getItem('carrinhoCliente');
    setItens(salvo ? JSON.parse(salvo) : []);
  }, []);

  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/clientes');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showSuccess, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatarTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    return value;
  };

  const handleTelefoneChange = (e) => {
    const formattedValue = formatarTelefone(e.target.value);
    setFormData(prev => ({
      ...prev,
      telefone: formattedValue
    }));
  };

  // Função para garantir que preco é número
  const getPreco = (item) => {
    if (typeof item.preco === 'string') return parseFloat(item.preco);
    if (typeof item.preco === 'number') return item.preco;
    if (typeof item.price === 'string') return parseFloat(item.price);
    if (typeof item.price === 'number') return item.price;
    return 0;
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const preco = getPreco(item);
      return total + (preco * (item.quantidade || 1));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pedidoData = {
        customer_name: formData.nome,
        customer_phone: formData.telefone,
        customer_address: formData.endereco,
        notes: formData.observacoes,
        total_amount: calcularTotal(),
        items: itens.map(item => ({
          product_name: item.nome || item.name,
          quantity: item.quantidade || 1,
          unit_price: getPreco(item),
          notes: item.observacoes || '',
          ingredients: item.ingredientes?.map(ing => ({
            ingredient: ing.id,
            is_added: true,
            price: ing.price || 0
          })) || []
        }))
      };

      await pedidosService.create(pedidoData);
      localStorage.removeItem('carrinhoCliente');
      setShowSuccess(true);
    } catch (err) {
      setError('Erro ao finalizar pedido. Tente novamente.');
      console.error('Erro ao finalizar pedido:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate('/clientes/carrinho');
  };

  if (showSuccess) {
    return (
      <div className="success-message">
        <h3>✨ Pedido Finalizado!</h3>
        <p>Seu pedido foi recebido com sucesso e está sendo processado. Em breve você receberá uma confirmação.</p>
        <p>Redirecionando em <span className="countdown">{countdown}</span> segundos...</p>
      </div>
    );
  }

  return (
    <div className="finalizar-pedido-container">
      <div className="finalizar-pedido-header">
        <h2>Finalizar Pedido</h2>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="finalizar-pedido-form">
        <div className="finalizar-pedido-section">
          <h3>Seus Dados</h3>
          <label htmlFor="nome" className="finalizar-pedido-label">Nome Completo</label>
          <input
            type="text"
            id="nome"
            name="nome"
            className="finalizar-pedido-input"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Digite seu nome completo"
          />
          <label htmlFor="telefone" className="finalizar-pedido-label">Telefone</label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            className="finalizar-pedido-input"
            value={formData.telefone}
            onChange={handleTelefoneChange}
            required
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="finalizar-pedido-section">
          <h3>Endereço de Entrega</h3>
          <label htmlFor="endereco" className="finalizar-pedido-label">Endereço Completo</label>
          <input
            type="text"
            id="endereco"
            name="endereco"
            className="finalizar-pedido-input"
            value={formData.endereco}
            onChange={handleChange}
            required
            placeholder="Rua, número, bairro, complemento"
          />
        </div>
        <div className="finalizar-pedido-section">
          <h3>Observações</h3>
          <label htmlFor="observacoes" className="finalizar-pedido-label">Observações</label>
          <textarea
            id="observacoes"
            name="observacoes"
            className="finalizar-pedido-input"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Alguma observação sobre o pedido?"
            rows="3"
          />
        </div>
        <div className="finalizar-pedido-resumo">
          <h4>Resumo do Pedido</h4>
          <ul className="finalizar-pedido-resumo-lista">
            {itens.map((item, index) => (
              <li key={index}>
                <span>{item.nome || item.name} x{item.quantidade}</span>
                <span>R$ {(getPreco(item) * (item.quantidade || 1)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="finalizar-pedido-total">
            <span>Total</span>
            <span>R$ {calcularTotal().toFixed(2)}</span>
          </div>
        </div>
        <button type="submit" className="finalizar-pedido-btn" disabled={loading}>
          {loading ? 'Finalizando...' : 'Finalizar Pedido'}
        </button>
        <button 
          type="button" 
          className="finalizar-pedido-btn" 
          style={{
            background: '#f4f8fb', 
            color: '#23408e', 
            marginTop: 10, 
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(37,99,235,0.08)'
          }} 
          onClick={handleVoltar} 
          disabled={loading}
        >
          Voltar
        </button>
      </form>
    </div>
  );
};

export default FinalizarPedido;
