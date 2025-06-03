import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import pedidosService from '../../../services/clientes/pedidos';
import configuracaoRestauranteService from '../../../services/configuracaorestaurante';
import './finalizarPedido.css';

const FinalizarPedido = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    payment_method: '',
    change_amount: ''
  });
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [showChangeInput, setShowChangeInput] = useState(false);
  const [precisaTroco, setPrecisaTroco] = useState('nao');

  useEffect(() => {
    const salvo = localStorage.getItem('carrinhoCliente');
    setItens(salvo ? JSON.parse(salvo) : []);

    // Carregar último pedido
    const pedidosSalvos = localStorage.getItem('pedidosCliente');
    if (pedidosSalvos) {
      const pedidos = JSON.parse(pedidosSalvos);
      if (pedidos.length > 0) {
        setUltimoPedido(pedidos[pedidos.length - 1]);
        // Se veio com ?usarUltimo=1, já preenche os campos
        const params = new URLSearchParams(location.search);
        if (params.get('usarUltimo') === '1') {
          setFormData({
            nome: pedidos[pedidos.length - 1].cliente.nome,
            telefone: pedidos[pedidos.length - 1].cliente.telefone,
            endereco: pedidos[pedidos.length - 1].cliente.endereco,
            payment_method: '',
            change_amount: ''
          });
        }
      }
    }

    // Carregar métodos de pagamento
    const fetchPaymentMethods = async () => {
      try {
        const response = await configuracaoRestauranteService.get();
        setPaymentMethods(response.data.payment_methods);
      } catch (err) {
        console.error('Erro ao carregar métodos de pagamento:', err);
      }
    };
    fetchPaymentMethods();
  }, [location.search]);

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

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate('/clientes/meus-pedidos');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'payment_method') {
      setShowChangeInput(value === 'dinheiro');
      setPrecisaTroco('nao');
      setFormData(prev => ({
        ...prev,
        payment_method: value,
        change_amount: ''
      }));
    }
  };

  const formatarTelefone = (value) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + número)
    const limitedNumbers = numbers.slice(0, 11);
    
    // Formata o número
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
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

  const usarDadosUltimoPedido = () => {
    if (ultimoPedido) {
      setFormData({
        nome: ultimoPedido.cliente.nome,
        telefone: ultimoPedido.cliente.telefone,
        endereco: ultimoPedido.cliente.endereco,
        payment_method: '',
        change_amount: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.payment_method) {
        setError('Selecione uma forma de pagamento.');
        setLoading(false);
        return;
      }
      let changeAmountToSend = null;
      if (formData.payment_method === 'dinheiro' && precisaTroco === 'sim') {
        changeAmountToSend = formData.change_amount;
        if (!changeAmountToSend || Number(changeAmountToSend) <= calcularTotal()) {
          setError('Informe um valor válido para o troco.');
          setLoading(false);
          return;
        }
      }
      const flattenItems = [];
      itens.forEach(item => {
        if (item.tipo === 'promocao' && Array.isArray(item.produtos)) {
          // Processa produtos da promoção
          item.produtos.forEach(prodPromo => {
            flattenItems.push({
              product_id: prodPromo.id,
              product_name: prodPromo.nome || prodPromo.name,
              quantity: prodPromo.quantidade || 1,
              unit_price: prodPromo.preco || prodPromo.price || 0,
              notes: prodPromo.observacoes || '',
              ingredients: (prodPromo.ingredientes || prodPromo.adicionais || []).map(ing => ({
                ingredient: ing.id,
                product_id: prodPromo.id,
                is_added: true,
                price: ing.price || 0
              })),
              item_type: 'promotion',
              promotion_id: item.promocaoId || item.promotionId || null
            });

            // Adiciona o brinde se existir na promoção (por produto)
            if (prodPromo.brinde) {
              flattenItems.push({
                product_id: prodPromo.brinde.id,
                product_name: prodPromo.brinde.nome || prodPromo.brinde.name,
                quantity: prodPromo.brinde.quantidade || 1,
                unit_price: 0, // Brinde é sempre gratuito
                notes: 'Brinde da promoção',
                ingredients: (prodPromo.brinde.ingredientes || prodPromo.brinde.adicionais || []).map(ing => ({
                  ingredient: ing.id,
                  product_id: prodPromo.brinde.id,
                  is_added: true,
                  price: 0 // Ingredientes do brinde também são gratuitos
                })),
                item_type: 'reward',
                promotion_id: item.promocaoId || item.promotionId || null
              });
            }
          });
          // Adiciona o brinde se existir na promoção (nível da promoção)
          if (item.brinde) {
            flattenItems.push({
              product_id: item.brinde.id,
              product_name: item.brinde.nome || item.brinde.name,
              quantity: item.brinde.quantidade || 1,
              unit_price: 0, // Brinde é sempre gratuito
              notes: 'Brinde da promoção',
              ingredients: (item.brinde.ingredientes || item.brinde.adicionais || []).map(ing => ({
                ingredient: ing.id,
                product_id: item.brinde.id,
                is_added: true,
                price: 0 // Ingredientes do brinde também são gratuitos
              })),
              item_type: 'reward',
              promotion_id: item.promocaoId || item.promotionId || null
            });
          }
        } else if (item.tipo === 'brinde') {
          // Processa itens que são brindes diretos
          flattenItems.push({
            product_id: item.id,
            product_name: item.nome || item.name,
            quantity: item.quantidade || 1,
            unit_price: 0, // Brinde é sempre gratuito
            notes: 'Brinde',
            ingredients: (item.ingredientes || item.adicionais || []).map(ing => ({
              ingredient: ing.id,
              product_id: item.id,
              is_added: true,
              price: 0 // Ingredientes do brinde também são gratuitos
            })),
            item_type: 'reward'
          });
        } else {
          // Processa itens regulares
          flattenItems.push({
            product_id: item.id,
            product_name: item.nome || item.name,
            quantity: item.quantidade || 1,
            unit_price: getPreco(item),
            notes: item.observacoes || '',
            ingredients: (item.ingredientes || item.adicionais || []).map(ing => ({
              ingredient: ing.id,
              product_id: item.id,
              is_added: true,
              price: ing.price || 0
            })),
            item_type: 'regular'
          });
        }
      });
      const pedidoData = {
        customer_name: formData.nome,
        customer_phone: formData.telefone,
        customer_address: formData.endereco,
        total_amount: calcularTotal(),
        payment_method: formData.payment_method,
        change_amount: formData.payment_method === 'dinheiro' ? parseFloat(formData.change_amount) : null,
        items: flattenItems
      };

      console.log('pedidoData:', pedidoData);
      await pedidosService.create(pedidoData);
      
      // Salvar pedido no histórico
      const pedidosSalvos = localStorage.getItem('pedidosCliente');
      const pedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
      pedidos.push({
        data: new Date().toISOString(),
        cliente: {
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco
        },
        status: 'pending',
        payment_method: formData.payment_method,
        change_amount: formData.change_amount,
        itens: itens.map(item => ({
          nome: item.nome || item.name,
          quantidade: item.quantidade || 1,
          preco: getPreco(item),
          ingredientes: item.ingredientes || item.adicionais || []
        }))
      });
      localStorage.setItem('pedidosCliente', JSON.stringify(pedidos));
      
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
        <div className="success-icon">✨</div>
        <h3>Pedido Finalizado!</h3>
        <p>Seu pedido foi recebido com sucesso e está sendo processado. Em breve você receberá uma confirmação.</p>
        <p>Redirecionando para <b>Meus Pedidos</b>...</p>
      </div>
    );
  }

  return (
    <div className="finalizar-pedido-container">
      <div className="finalizar-pedido-header">
        <h2>Finalizar Pedido</h2>
      </div>
      {error && (
        <div className="error-message">
          <span role="img" aria-label="error">⚠️</span>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="finalizar-pedido-form">
        <div className="finalizar-pedido-section">
          <h3>Seus Dados</h3>
          {ultimoPedido && (
            <button 
              type="button" 
              className="usar-dados-anteriores-btn"
              onClick={usarDadosUltimoPedido}
            >
              <span role="img" aria-label="reuse">🔄</span> Usar dados do último pedido
            </button>
          )}
          <div className="input-group">
            <label htmlFor="nome" className="finalizar-pedido-label">
              <span role="img" aria-label="user">👤</span> Nome Completo
            </label>
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
          </div>
          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />
          </div>
        </div>

        <div className="finalizar-pedido-section">
          <h3>Endereço de Entrega</h3>
          <div className="input-group">
            <label htmlFor="endereco" className="finalizar-pedido-label">
              <span role="img" aria-label="location">📍</span> Endereço Completo
            </label>
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
        </div>

        <div className="finalizar-pedido-section">
          <h3>Forma de Pagamento</h3>
          <div className="payment-methods-grid">
            {paymentMethods && (
              <>
                {paymentMethods.dinheiro && (
                  <div className="payment-method-item">
                    <label className="payment-method-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="dinheiro"
                        checked={formData.payment_method === 'dinheiro'}
                        onChange={handleChange}
                        required
                      />
                      <span>Dinheiro</span>
                    </label>
                  </div>
                )}
                {paymentMethods.cartao_debito && (
                  <div className="payment-method-item">
                    <label className="payment-method-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cartao_debito"
                        checked={formData.payment_method === 'cartao_debito'}
                        onChange={handleChange}
                        required
                      />
                      <span>Cartão de Débito</span>
                    </label>
                  </div>
                )}
                {paymentMethods.cartao_credito && (
                  <div className="payment-method-item">
                    <label className="payment-method-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cartao_credito"
                        checked={formData.payment_method === 'cartao_credito'}
                        onChange={handleChange}
                        required
                      />
                      <span>Cartão de Crédito</span>
                    </label>
                  </div>
                )}
                {paymentMethods.pix && (
                  <div className="payment-method-item">
                    <label className="payment-method-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="pix"
                        checked={formData.payment_method === 'pix'}
                        onChange={handleChange}
                        required
                      />
                      <span>PIX</span>
                    </label>
                    {formData.payment_method === 'pix' && paymentMethods.pix_key && (
                      <div className="pix-info">
                        <p>Chave PIX: {paymentMethods.pix_key}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {showChangeInput && (
            <div className="change-amount-section">
              <div className="change-amount-header">
                <span role="img" aria-label="money">💰</span>
                <h4>Precisa de troco?</h4>
              </div>
              <div className="change-amount-options">
                <label className="change-option">
                  <input 
                    type="radio" 
                    name="precisaTroco" 
                    value="sim" 
                    checked={precisaTroco==='sim'} 
                    onChange={()=>setPrecisaTroco('sim')} 
                  />
                  <span className="option-label">Sim</span>
                </label>
                <label className="change-option">
                  <input 
                    type="radio" 
                    name="precisaTroco" 
                    value="nao" 
                    checked={precisaTroco==='nao'} 
                    onChange={()=>setPrecisaTroco('nao')} 
                  />
                  <span className="option-label">Não</span>
                </label>
              </div>
              {precisaTroco === 'sim' && (
                <div className="change-amount-input-container">
                  <label htmlFor="change_amount" className="change-amount-label">
                    <span role="img" aria-label="calculator">🧮</span>
                    Troco para quanto?
                  </label>
                  <div className="change-amount-input-wrapper">
                    <span className="currency-symbol">R$</span>
                    <input
                      type="number"
                      id="change_amount"
                      name="change_amount"
                      value={formData.change_amount}
                      onChange={handleChange}
                      min={calcularTotal()}
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <p className="change-amount-hint">
                    Valor mínimo: R$ {calcularTotal().toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="finalizar-pedido-resumo">
          <h4>
            <span role="img" aria-label="cart">🛒</span> Resumo do Pedido
          </h4>
          <ul className="finalizar-pedido-resumo-lista">
            {itens.map((item, index) => (
              <li key={index}>
                <span className="item-name">{item.nome || item.name}</span>
                <span className="item-quantity">x{item.quantidade}</span>
                <span className="item-price">R$ {(getPreco(item) * (item.quantidade || 1)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="finalizar-pedido-total">
            <span>Total</span>
            <span>R$ {calcularTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="finalizar-pedido-buttons">
          <button type="button" onClick={handleVoltar} className="voltar-button">
            Voltar
          </button>
          <button type="submit" className="finalizar-button" disabled={loading}>
            {loading ? 'Finalizando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinalizarPedido;
