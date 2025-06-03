import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './carrinhoCliente.css';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const CarrinhoCliente = ({ itens: propsItens, onRemoverItem: propsOnRemoverItem, onAtualizarQuantidade: propsOnAtualizarQuantidade }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFullPage = location.pathname === '/clientes/carrinho';

  // Estado local para itens do carrinho se não vierem via props
  const [localItens, setLocalItens] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Sempre que a rota mudar, recarrega do localStorage se não vier via props
  useEffect(() => {
    if (!propsItens) {
      const salvo = localStorage.getItem('carrinhoCliente');
      const parsed = salvo ? JSON.parse(salvo) : [];
      console.log('Lendo carrinho do localStorage em CarrinhoCliente:', parsed);
      setLocalItens(parsed);
    }
  }, [propsItens, location.pathname]);

  // Funções de manipulação
  const removerDoCarrinho = (index) => {
    if (propsOnRemoverItem) return propsOnRemoverItem(index);
    setLocalItens(prev => {
      const novo = prev.filter((_, i) => i !== index);
      localStorage.setItem('carrinhoCliente', JSON.stringify(novo));
      return novo;
    });
  };

  const atualizarQuantidade = (index, novaQuantidade) => {
    if (propsOnAtualizarQuantidade) return propsOnAtualizarQuantidade(index, novaQuantidade);
    if (novaQuantidade < 1) return;
    setLocalItens(prev => {
      const novo = prev.map((item, i) => i === index ? { ...item, quantidade: novaQuantidade } : item);
      localStorage.setItem('carrinhoCliente', JSON.stringify(novo));
      return novo;
    });
  };

  // Mas na página do carrinho, SEMPRE usa o localItens
  const itens = isFullPage ? localItens : (propsItens || localItens);

  // Função para garantir que preco é número
  const getPreco = (item) => {
    if (typeof item.preco === 'string') return parseFloat(item.preco);
    if (typeof item.preco === 'number') return item.preco;
    if (typeof item.price === 'string') return parseFloat(item.price);
    if (typeof item.price === 'number') return item.price;
    return 0;
  };

  const calcularSubtotal = (item) => {
    const preco = getPreco(item);
    return ((preco || 0) * (item.quantidade || 1)).toFixed(2);
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      // Não inclui brindes no total
      if (item.tipo === 'brinde') return total;
      const preco = getPreco(item);
      return total + ((preco || 0) * (item.quantidade || 1));
    }, 0).toFixed(2);
  };

  const handleFinalizarPedido = () => {
    const pedidosSalvos = localStorage.getItem('pedidosCliente');
    const pedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
    if (pedidos.length > 0) {
      setShowModal(true);
    } else {
      navigate('/clientes/finalizar-pedido');
    }
  };

  const handleModalEscolha = (usarUltimo) => {
    setShowModal(false);
    setModalLoading(true);
    setTimeout(() => {
      if (usarUltimo) {
        navigate('/clientes/finalizar-pedido?usarUltimo=1');
      } else {
        navigate('/clientes/finalizar-pedido');
      }
      setModalLoading(false);
    }, 200);
  };

  const renderModal = () => (
    <div className="modal-confirm-overlay">
      <div className="modal-confirm-content">
        <h3>Usar dados do último pedido?</h3>
        <p>Deseja preencher automaticamente com nome, telefone e endereço do último pedido realizado?</p>
        <div className="modal-confirm-actions">
          <button className="modal-confirm-btn sim" onClick={() => handleModalEscolha(true)} disabled={modalLoading}>Sim</button>
          <button className="modal-confirm-btn nao" onClick={() => handleModalEscolha(false)} disabled={modalLoading}>Não</button>
        </div>
      </div>
    </div>
  );

  const renderCarrinho = () => (
    <div className={`carrinho-cliente carrinho-cliente--fullpage`}>
      <div className="carrinho-cliente__header">
        <h2>Seu Pedido</h2>
        <button className="carrinho-cliente__voltar-btn" onClick={() => navigate('/clientes')}>
          <FaArrowLeft /> Voltar
        </button>
      </div>

      <div className="carrinho-cliente__items">
        {itens.length === 0 ? (
          <div className="carrinho-cliente__vazio">
            <p>Seu carrinho está vazio</p>
            <span>Adicione itens do cardápio</span>
          </div>
        ) : (
          itens.map((item, index) => (
            <div key={index} className={`carrinho-cliente__item ${item.tipo === 'brinde' ? 'carrinho-cliente__item--brinde' : ''}`}>
              <div className="carrinho-cliente__item-info">
                <h3>
                  {item.nome || item.name}
                  {item.tipo === 'brinde' && <span className="carrinho-cliente__item-brinde-tag">Brinde</span>}
                </h3>
                <p className="carrinho-cliente__item-preco">
                  {item.tipo === 'brinde' ? 'Grátis' : `R$ ${(getPreco(item) || 0).toFixed(2)}`}
                </p>
              </div>

              <div className="carrinho-cliente__item-controles">
                <div className="carrinho-cliente__quantidade-controle">
                  <button 
                    onClick={() => atualizarQuantidade(index, item.quantidade - 1)}
                    disabled={item.quantidade <= 1 || item.tipo === 'brinde'}
                  >
                    <FaMinus />
                  </button>
                  <span>{item.quantidade}</span>
                  <button 
                    onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                    disabled={item.tipo === 'brinde'}
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="carrinho-cliente__item-subtotal">
                  <span>{item.tipo === 'brinde' ? 'Grátis' : `R$ ${calcularSubtotal(item)}`}</span>
                  {item.tipo !== 'brinde' && (
                    <button 
                      className="carrinho-cliente__remover-btn"
                      onClick={() => removerDoCarrinho(index)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {itens.length > 0 && (
        <div className="carrinho-cliente__footer">
          <div className="carrinho-cliente__total">
            <span>Total do Pedido</span>
            <strong>R$ {calcularTotal()}</strong>
          </div>
          <button 
            className="carrinho-cliente__finalizar-btn"
            onClick={handleFinalizarPedido}
          >
            Finalizar Pedido
          </button>
        </div>
      )}
      {showModal && renderModal()}
    </div>
  );

  if (isFullPage) {
    return renderCarrinho();
  }

  // Botão flutuante que redireciona para a página do carrinho
  return (
    <div className="carrinho-cliente-flutuante">
      <button className="carrinho-cliente-btn" onClick={() => navigate('/clientes/carrinho')}>
        <div className="carrinho-cliente-btn__icone">
          <FaShoppingCart />
          {itens.length > 0 && (
            <span className="carrinho-cliente-btn__contador">
              {itens.reduce((total, item) => total + item.quantidade, 0)}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

export default CarrinhoCliente;
