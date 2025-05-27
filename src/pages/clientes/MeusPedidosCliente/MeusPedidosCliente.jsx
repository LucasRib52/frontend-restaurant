import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './meuspedidoscliente.css';
import { MdArrowBack, MdReceipt, MdAccessTime, MdLocationOn, MdPhone, MdAttachMoney, MdFastfood, MdPix, MdCreditCard, MdClose } from 'react-icons/md';
import pedidosRestauranteService from '../../../services/pedidosrestaurante';
import configuracaoRestauranteService from '../../../services/configuracaorestaurante';

const statusLabels = {
  pending: 'Em Espera',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};
const statusColors = {
  pending: '#e65100',
  confirmed: '#1565c0',
  preparing: '#2e7d32',
  ready: '#6a1b9a',
  delivered: '#283593',
  cancelled: '#c62828',
};

const getPaymentLabel = (method) => {
  switch (method) {
    case 'dinheiro':
      return <><MdAttachMoney style={{verticalAlign:'middle'}}/> Dinheiro</>;
    case 'cartao_debito':
      return <><MdCreditCard style={{verticalAlign:'middle'}}/> Cartão de Débito</>;
    case 'cartao_credito':
      return <><MdCreditCard style={{verticalAlign:'middle'}}/> Cartão de Crédito</>;
    case 'pix':
      return <><MdPix style={{verticalAlign:'middle'}}/> PIX</>;
    default:
      return 'Não informado';
  }
};

const MeusPedidosCliente = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixPedidoIndex, setPixPedidoIndex] = useState(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef();

  // Buscar chave PIX do backend
  const fetchPixKey = async () => {
    setLoadingPix(true);
    try {
      const response = await configuracaoRestauranteService.get();
      setPixKey(response.data.payment_methods?.pix_key || '');
    } catch (e) {
      setPixKey('Não foi possível obter a chave PIX.');
    } finally {
      setLoadingPix(false);
    }
  };

  // Função para sincronizar status com backend
  const sincronizarStatus = async (pedidosLocal) => {
    try {
      const backendPedidos = await pedidosRestauranteService.getAll();
      const backendList = Array.isArray(backendPedidos) ? backendPedidos : backendPedidos.results || [];
      const atualizados = pedidosLocal.map(pedidoLocal => {
        // Busca pedido do backend com mesmo telefone, total, quantidade de itens e data próxima (até 10min)
        const encontrado = backendList.find(p => {
          return (
            p.customer_phone === pedidoLocal.cliente.telefone &&
            Math.abs(new Date(p.created_at) - new Date(pedidoLocal.data)) < 1000 * 60 * 10 &&
            Number(p.total_amount).toFixed(2) === Number(pedidoLocal.itens.reduce((t, i) => t + (i.preco * i.quantidade), 0)).toFixed(2) &&
            (p.items?.length || 0) === pedidoLocal.itens.length
          );
        });
        if (encontrado && encontrado.status) {
          return { ...pedidoLocal, status: encontrado.status };
        }
        return pedidoLocal;
      });
      setPedidos(atualizados);
      localStorage.setItem('pedidosCliente', JSON.stringify(atualizados));
    } catch (e) {
      setPedidos(pedidosLocal);
    }
  };

  useEffect(() => {
    // Carregar pedidos do localStorage
    const pedidosSalvos = localStorage.getItem('pedidosCliente');
    const pedidosLocal = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
    setPedidos(pedidosLocal);
    sincronizarStatus(pedidosLocal);
    // Atualizar a cada 15 segundos
    intervalRef.current = setInterval(() => {
      sincronizarStatus(pedidosLocal);
    }, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotal = (itens) => {
    return itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  return (
    <div className="meus-pedidos-container">
      <div className="meus-pedidos-header">
        <button className="meus-pedidos-voltar" onClick={() => navigate('/clientes')}>
          <MdArrowBack /> Voltar
        </button>
        <h1 className="meus-pedidos-titulo">Meus Pedidos</h1>
      </div>

      {pedidos.length === 0 ? (
        <div className="meus-pedidos-vazio">
          <MdReceipt className="meus-pedidos-vazio-icon" />
          <p>Você ainda não fez nenhum pedido</p>
        </div>
      ) : (
        <div className="meus-pedidos-lista">
          {pedidos.slice().sort((a, b) => new Date(b.data) - new Date(a.data)).map((pedido, index) => (
            <div key={index} className="meus-pedidos-card">
              <div className="meus-pedidos-card-header">
                <span className="meus-pedidos-card-numero">Pedido #{index + 1}</span>
                <span className="meus-pedidos-card-data">
                  <MdAccessTime /> {formatarData(pedido.data)}
                </span>
                <span className="meus-pedidos-card-status-badge" style={{background: statusColors[pedido.status] || '#bbb'}}>
                  {statusLabels[pedido.status] || 'Em Espera'}
                </span>
              </div>
              
              <div className="meus-pedidos-card-info">
                <div className="meus-pedidos-card-cliente">
                  <h3>Dados do Cliente</h3>
                  <p><strong>Nome:</strong> {pedido.cliente.nome}</p>
                  <p><MdPhone /> {pedido.cliente.telefone}</p>
                  <p><MdLocationOn /> {pedido.cliente.endereco}</p>
                </div>

                <div className="meus-pedidos-card-itens">
                  <h3>Itens do Pedido</h3>
                  {pedido.itens.map((item, itemIndex) => (
                    <div key={itemIndex} className="meus-pedidos-card-item">
                      <span className="meus-pedidos-card-item-quantidade">{item.quantidade}x</span>
                      <span className="meus-pedidos-card-item-nome">{item.nome}</span>
                      <span className="meus-pedidos-card-item-preco">
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </span>
                      {item.ingredientes && item.ingredientes.length > 0 && (
                        <div className="meus-pedidos-card-ingredientes">
                          <MdFastfood style={{marginRight:4}}/> <b>Ingredientes:</b> {item.ingredientes.map((ing, i) => ing.name || ing.nome || ing.ingredient?.name).filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="meus-pedidos-card-total">
                  <MdAttachMoney />
                  <span>Total: R$ {calcularTotal(pedido.itens).toFixed(2)}</span>
                </div>
                <div className="meus-pedidos-card-pagamento">
                  <strong>Pagamento:</strong> {getPaymentLabel(pedido.payment_method)}
                  {pedido.payment_method === 'pix' && (
                    <button
                      className="ver-pix-btn"
                      onClick={async () => {
                        setPixPedidoIndex(index);
                        await fetchPixKey();
                        setPixModalOpen(true);
                      }}
                    >
                      Ver PIX
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal PIX */}
      {pixModalOpen && (
        <div className="pix-modal-overlay" onClick={() => setPixModalOpen(false)}>
          <div className="pix-modal" onClick={e => e.stopPropagation()}>
            <button className="pix-modal-close" onClick={() => setPixModalOpen(false)}><MdClose size={24}/></button>
            <div className="pix-modal-content">
              <MdPix size={48} style={{color:'#00796b', marginBottom:8}}/>
              <h2>Chave PIX do Restaurante</h2>
              {loadingPix ? (
                <p>Carregando...</p>
              ) : (
                <p className="pix-modal-key">{pixKey || 'Chave não cadastrada.'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusPedidosCliente; 