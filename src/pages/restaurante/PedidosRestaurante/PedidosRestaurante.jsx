import React, { useEffect, useState } from 'react';
import pedidosRestauranteService from '../../../services/pedidosrestaurante';
import { MdCheck, MdClose, MdPrint, MdRemoveRedEye, MdFastfood, MdAccessTime, MdDone, MdCancel, MdDeliveryDining, MdFilterList, MdSchedule } from 'react-icons/md';
import './pedidosRestaurante.css';

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};
const statusIcons = {
  pending: <MdAccessTime className="status-icon" />, // relógio
  confirmed: <MdCheck className="status-icon" />, // check
  preparing: <MdFastfood className="status-icon" />, // comida
  ready: <MdDone className="status-icon" />, // done
  delivered: <MdDeliveryDining className="status-icon" />, // entrega
  cancelled: <MdCancel className="status-icon" />, // cancel
};

const quickFilters = [
  { label: 'Todos', value: 'all', icon: <MdFilterList /> },
  { label: 'Últimas 24h', value: 'last24h', icon: <MdSchedule /> },
  { label: 'Pendentes', value: 'pending', icon: <MdAccessTime /> },
  { label: 'Em preparo', value: 'preparing', icon: <MdFastfood /> },
  { label: 'Prontos', value: 'ready', icon: <MdDone /> },
  { label: 'Entregues', value: 'delivered', icon: <MdDeliveryDining /> },
  { label: 'Cancelados', value: 'cancelled', icon: <MdCancel /> },
];

function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isLast24Hours(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - d) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

const getPaymentMethodFromPedido = (pedido) => {
  return pedido.payment_method || '';
};

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'dinheiro':
      return 'Dinheiro';
    case 'cartao_debito':
      return 'Cartão de Débito';
    case 'cartao_credito':
      return 'Cartão de Crédito';
    case 'pix':
      return 'PIX';
    default:
      return 'Não informado';
  }
};

const getPaymentDetails = (pedido) => {
  const method = getPaymentMethodFromPedido(pedido);
  if (method === 'dinheiro') {
    if (pedido.change_amount && Number(pedido.change_amount) > 0) {
      return `Dinheiro\nTroco para: R$ ${Number(pedido.change_amount).toFixed(2)}`;
    }
    return 'Dinheiro';
  }
  if (method === 'cartao_debito') return 'Cartão de Débito';
  if (method === 'cartao_credito') return 'Cartão de Crédito';
  if (method === 'pix') return 'PIX';
  return 'Não informado';
};

const PedidosRestaurante = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('last24h');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPedidos();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await pedidosRestauranteService.getAll();
      console.log('Resposta completa da API:', JSON.stringify(response, null, 2)); // Log detalhado
      
      // Verifica se a resposta é um array ou tem a propriedade results
      const pedidosData = Array.isArray(response) ? response : response.results || [];
      console.log('Estrutura do primeiro pedido:', pedidosData[0] ? JSON.stringify(pedidosData[0], null, 2) : 'Nenhum pedido');
      
      setPedidos(pedidosData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Erro ao carregar pedidos');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pedidoId, newStatus) => {
    try {
      setUpdating(pedidoId);
      await pedidosRestauranteService.updateStatus(pedidoId, newStatus);
      await fetchPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status:', err); // Log para debug
      setError('Erro ao atualizar status do pedido');
    } finally {
      setUpdating(null);
    }
  };

  const formatarPedidoParaImpressao = (pedido) => {
    const data = new Date(pedido.created_at).toLocaleString('pt-BR');
    const linhas = [
      '--------------------------------',
      `PEDIDO #${pedido.id}`,
      '--------------------------------',
      `CLIENTE: ${pedido.customer_name}`,
      `TEL: ${pedido.customer_phone}`,
      `END: ${pedido.customer_address}`,
      ''
    ];

    // Adiciona os itens do pedido
    if (pedido.items && Array.isArray(pedido.items)) {
      pedido.items.forEach((item, index) => {
        // Nome do item com quantidade se for maior que 1
        const nomeProduto = item.product_name.toUpperCase();
        const itemLine = item.quantity > 1 
          ? `${index + 1}. ***${nomeProduto}*** (${item.quantity}x)`
          : `${index + 1}. ***${nomeProduto}***`;
        linhas.push(itemLine);

        // Ingredientes agrupados por grupo
        if (item.ingredients && item.ingredients.length > 0) {
          const grupos = item.ingredients.reduce((acc, ing) => {
            const group = ing.group_name || 'Outros';
            if (!acc[group]) acc[group] = [];
            acc[group].push(ing.ingredient.name);
            return acc;
          }, {});
          Object.entries(grupos).forEach(([grupo, ings]) => {
            linhas.push(`   - ${grupo}: ${ings.join(', ')}`);
          });
        }

        // Observações
        if (item.notes) {
          linhas.push(`   Obs: ${item.notes}`);
        }

        // Linha em branco entre itens
        linhas.push('');
      });
    }

    // Adiciona o total e forma de pagamento
    linhas.push(
      '',
      `TOTAL: R$ ${Number(pedido.total_amount).toFixed(2)}`,
      ''
    );

    // Adiciona forma de pagamento e troco se for em dinheiro
    if (pedido.payment_method === 'dinheiro') {
      linhas.push('Forma de Pagamento: Dinheiro');
      if (pedido.change_amount && Number(pedido.change_amount) > 0) {
        linhas.push(`Troco para: R$ ${Number(pedido.change_amount).toFixed(2)}`);
      }
    } else {
      linhas.push(`Forma de Pagamento: ${getPaymentMethodLabel(pedido.payment_method)}`);
    }

    linhas.push(
      '',
      `Data: ${data}`,
      '--------------------------------'
    );

    return linhas.join('\n');
  };

  const imprimirViaRawBT = (pedido) => {
    const conteudo = formatarPedidoParaImpressao(pedido);
    console.log('Conteúdo para impressão:', conteudo); // Log para debug
    const rawbtUrl = `rawbt:${encodeURIComponent(conteudo)}`;
    window.open(rawbtUrl, '_blank');
  };

  // Filtro dos pedidos
  const filteredPedidos = pedidos.filter(pedido => {
    if (filter === 'all') return true;
    if (filter === 'last24h') return isLast24Hours(pedido.created_at);
    return pedido.status === filter;
  });

  // NOVO: Renderização dos cards premium
  const renderPedidosCards = () => (
    <div className="pedidos-cards-grid">
      {filteredPedidos.map((pedido) => (
        <div key={pedido.id} className="pedido-card">
          <div className="pedido-card-header">
            <span className="pedido-card-id">#{pedido.id}</span>
            <span className={`pedido-card-status ${pedido.status}`}>
              {statusIcons[pedido.status]} {statusLabels[pedido.status] || pedido.status}
            </span>
          </div>
          <div className="pedido-card-info">
            <span><strong>Cliente:</strong> {pedido.customer_name}</span>
            <span><strong>Telefone:</strong> {pedido.customer_phone}</span>
            <span><strong>Endereço:</strong> {pedido.customer_address}</span>
            <span><strong>Data:</strong> {new Date(pedido.created_at).toLocaleString('pt-BR')}</span>
            <span><strong>Pagamento:</strong> {getPaymentDetails(pedido).split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</span>
          </div>
          <div className="pedido-card-total">
            Total: R$ {Number(pedido.total_amount).toFixed(2)}
          </div>
          <div className="pedido-card-actions">
            {pedido.status === 'pending' && (
              <>
                <button className="pedido-card-btn confirmar" onClick={() => handleStatusUpdate(pedido.id, 'confirmed')} disabled={updating === pedido.id} title="Confirmar">
                  <MdCheck style={{marginRight:6}}/> Confirmar
                </button>
                <button className="pedido-card-btn cancelar" onClick={() => handleStatusUpdate(pedido.id, 'cancelled')} disabled={updating === pedido.id} title="Cancelar">
                  <MdClose style={{marginRight:6}}/> Cancelar
                </button>
              </>
            )}
            {pedido.status === 'confirmed' && (
              <>
                <button className="pedido-card-btn preparar" onClick={() => handleStatusUpdate(pedido.id, 'preparing')} disabled={updating === pedido.id} title="Iniciar Preparo">
                  <MdFastfood style={{marginRight:6}}/> Preparar
                </button>
                <button className="pedido-card-btn imprimir" onClick={() => imprimirViaRawBT(pedido)} title="Imprimir">
                  <MdPrint style={{marginRight:6}}/> Imprimir
                </button>
              </>
            )}
            {pedido.status === 'preparing' && (
              <>
                <button className="pedido-card-btn pronto" onClick={() => handleStatusUpdate(pedido.id, 'ready')} disabled={updating === pedido.id} title="Marcar como Pronto">
                  <MdDone style={{marginRight:6}}/> Pronto
                </button>
                <button className="pedido-card-btn imprimir" onClick={() => imprimirViaRawBT(pedido)} title="Imprimir">
                  <MdPrint style={{marginRight:6}}/> Imprimir
                </button>
              </>
            )}
            {pedido.status === 'ready' && (
              <>
                <button className="pedido-card-btn entregue" onClick={() => handleStatusUpdate(pedido.id, 'delivered')} disabled={updating === pedido.id} title="Marcar como Entregue">
                  <MdDeliveryDining style={{marginRight:6}}/> Entregue
                </button>
                <button className="pedido-card-btn imprimir" onClick={() => imprimirViaRawBT(pedido)} title="Imprimir">
                  <MdPrint style={{marginRight:6}}/> Imprimir
                </button>
              </>
            )}
            <button className="pedido-card-btn visualizar" onClick={() => { setSelectedPedido(pedido); setShowModal(true); }} title="Visualizar Detalhes">
              <MdRemoveRedEye />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderModal = () => {
    if (!showModal || !selectedPedido) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-content-beautiful">
          <div className="modal-header">
            <h2><MdRemoveRedEye style={{verticalAlign:'middle',marginRight:8}}/> Detalhes do Pedido #{selectedPedido.id}</h2>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <div className="modal-body modal-body-beautiful">
            <div className="pedido-modal-status-row">
              <span className={`pedido-card-status ${selectedPedido.status}`}>{statusIcons[selectedPedido.status]} {statusLabels[selectedPedido.status]}</span>
            </div>
            <div className="pedido-modal-info-blocks">
              <div className="pedido-modal-info-block">
                <span className="pedido-modal-info-label">Cliente</span>
                <span className="pedido-modal-info-value">{selectedPedido.customer_name}</span>
              </div>
              <div className="pedido-modal-info-block">
                <span className="pedido-modal-info-label">Telefone</span>
                <span className="pedido-modal-info-value">{selectedPedido.customer_phone}</span>
              </div>
              <div className="pedido-modal-info-block">
                <span className="pedido-modal-info-label">Endereço</span>
                <span className="pedido-modal-info-value">{selectedPedido.customer_address}</span>
              </div>
              <div className="pedido-modal-info-block">
                <span className="pedido-modal-info-label">Data</span>
                <span className="pedido-modal-info-value">{new Date(selectedPedido.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <div className="pedido-modal-info-block">
                <span className="pedido-modal-info-label">Pagamento</span>
                <span className="pedido-modal-info-value">{getPaymentDetails(selectedPedido).split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</span>
              </div>
            </div>
            <div className="pedido-modal-items-block">
              <h3><MdFastfood style={{verticalAlign:'middle',marginRight:6}}/> Itens do Pedido</h3>
              {selectedPedido.items && selectedPedido.items.map((item, index) => (
                <div key={item.id} className="pedido-item pedido-modal-item">
                  <p><strong>{index + 1}. {item.product_name}</strong></p>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="item-ingredients">
                      <p>Ingredientes:</p>
                      <ul>
                        {Object.entries(
                          item.ingredients.reduce((acc, ing) => {
                            const group = ing.group_name || 'Outros';
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(ing.ingredient.name);
                            return acc;
                          }, {})
                        ).map(([group, ings]) => (
                          <li key={group}>
                            <strong>{group}:</strong> {ings.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.notes && <p><em>Obs: {item.notes}</em></p>}
                  {item.quantity > 1 && <p>Quantidade: {item.quantity}</p>}
                </div>
              ))}
            </div>
            <div className="pedido-modal-total-block">
              <span className="pedido-modal-total-label">Total</span>
              <span className="pedido-modal-total-value">R$ {Number(selectedPedido.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFilterButtons = () => (
    <div className="filter-container">
      <button 
        className="filter-toggle-btn"
        onClick={() => setShowFilters(!showFilters)}
      >
        <MdFilterList /> Filtros
      </button>
      <div className={`filter-buttons ${showFilters ? 'show' : ''}`}>
        {quickFilters.map(({ label, value, icon }) => (
          <button
            key={value}
            className={`filter-btn ${filter === value ? 'active' : ''}`}
            onClick={() => {
              setFilter(value);
              setShowFilters(false);
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pedidos-restaurante-container">
      <div className="pedidos-restaurante-header">
        <h1>Pedidos</h1>
        {renderFilterButtons()}
      </div>
      {error && <div className="pedidos-restaurante-error">{error}</div>}
      {loading ? (
        <div className="pedidos-restaurante-loading">Carregando pedidos...</div>
      ) : (
        filteredPedidos.length === 0 ? (
          <div className="pedidos-restaurante-vazio">Nenhum pedido encontrado.</div>
        ) : (
          renderPedidosCards()
        )
      )}
      {renderModal()}
    </div>
  );
};

export default PedidosRestaurante;
