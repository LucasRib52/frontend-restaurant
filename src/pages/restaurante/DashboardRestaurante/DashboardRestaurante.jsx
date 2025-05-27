import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/api';
import { FaShoppingCart, FaDollarSign } from 'react-icons/fa';
import { Pagination } from '@mui/material';
import './DashboardRestaurante.css';
import pedidosRestauranteService from '../../../services/pedidosrestaurante';

const DashboardRestaurante = () => {
  const [summary, setSummary] = useState({
    total_orders: 0,
    total_revenue: 0,
    today_orders: 0,
    today_revenue: 0,
    week_orders: 0,
    week_revenue: 0,
    month_orders: 0,
    month_revenue: 0,
    recent_orders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today'); // today, week, month
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  const statusMap = {
    confirmed: { label: 'Confirmado', className: 'confirmed' },
    entregue: { label: 'Entregue', className: 'delivered' },
    delivered: { label: 'Entregue', className: 'delivered' },
    cancelled: { label: 'Cancelado', className: 'cancelled' },
    cancelado: { label: 'Cancelado', className: 'cancelled' },
    preparing: { label: 'Preparando', className: 'preparing' },
    pendente: { label: 'Pendente', className: 'pending' },
    pending: { label: 'Pendente', className: 'pending' },
    ready: { label: 'Pronto', className: 'ready' },
  };

  useEffect(() => {
    fetchData();
    const fetchPedidos = async () => {
      try {
        setLoadingPedidos(true);
        const data = await pedidosRestauranteService.getAll();
        setPedidos(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setPedidos([]);
      } finally {
        setLoadingPedidos(false);
      }
    };
    fetchPedidos();
    // Opcional: polling a cada 30s
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSummary(filter);
      setSummary(data || {
        total_orders: 0,
        total_revenue: 0,
        today_orders: 0,
        today_revenue: 0,
        week_orders: 0,
        week_revenue: 0,
        month_orders: 0,
        month_revenue: 0,
        recent_orders: []
      });
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      default:
        return 'Hoje';
    }
  };

  const getFilterData = () => {
    switch (filter) {
      case 'today':
        return {
          orders: summary.today_orders || 0,
          revenue: summary.today_revenue || 0
        };
      case 'week':
        return {
          orders: summary.week_orders || 0,
          revenue: summary.week_revenue || 0
        };
      case 'month':
        return {
          orders: summary.month_orders || 0,
          revenue: summary.month_revenue || 0
        };
      default:
        return {
          orders: summary.today_orders || 0,
          revenue: summary.today_revenue || 0
        };
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={fetchData}>Tentar novamente</button>
      </div>
    );
  }

  const filterData = getFilterData();
  const totalPages = Math.ceil((summary.recent_orders?.length || 0) / itemsPerPage);
  const paginatedOrders = summary.recent_orders?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  ) || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="filter-buttons">
          <button
            className={filter === 'today' ? 'active' : ''}
            onClick={() => setFilter('today')}
          >
            Hoje
          </button>
          <button
            className={filter === 'week' ? 'active' : ''}
            onClick={() => setFilter('week')}
          >
            Esta Semana
          </button>
          <button
            className={filter === 'month' ? 'active' : ''}
            onClick={() => setFilter('month')}
          >
            Este Mês
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>Pedidos</h3>
            <div className="stat-value">{pedidos.length}</div>
            <p className="stat-label">Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Faturamento</h3>
            <div className="stat-value">{formatCurrency(pedidos.reduce((acc, pedido) => acc + (Number(pedido.total_amount) || 0), 0))}</div>
            <p className="stat-label">Total</p>
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <h2>Pedidos Recentes</h2>
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {loadingPedidos ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Carregando pedidos...
                  </td>
                </tr>
              ) : pedidos.length > 0 ? (
                pedidos.slice(0, 5).map((order) => {
                  const statusKey = (order.status || '').toLowerCase();
                  const statusInfo = statusMap[statusKey] || { label: order.status, className: '' };
                  return (
                    <tr key={order.id}>
                      <td data-label="ID">#{order.id}</td>
                      <td data-label="Cliente">{order.customer_name}</td>
                      <td data-label="Valor">{formatCurrency(order.total_amount)}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>
                      </td>
                      <td data-label="Data">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhum pedido recente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination-container">
          <Pagination
            count={Math.max(1, totalPages)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '8px',
                margin: '0 4px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 123, 255, 0.1)',
                  transform: 'translateY(-2px)'
                }
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 123, 255, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0056b3 0%, #004494 100%)'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardRestaurante; 