import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../../services/api';
import { FaShoppingCart, FaDollarSign, FaFilter } from 'react-icons/fa';
import { Pagination } from '@mui/material';
import './DashboardRestaurante.css';
import pedidosRestauranteService from '../../../services/pedidosrestaurante';

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Em Preparo', value: 'preparing' },
  { label: 'Prontos', value: 'ready' },
  { label: 'Entregues', value: 'delivered' }
];
const periodOptions = [
  { label: 'Hoje', value: 'today' },
  { label: '7 Dias', value: 'week' },
  { label: '30 Dias', value: 'month' },
  { label: 'Mês Passado', value: 'lastMonth' }
];

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
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    period: 'today'
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const applyFilters = (orders) => {
    return orders.filter(order => {
      const statusMatch = activeFilters.status === 'all' || order.status?.toLowerCase() === activeFilters.status.toLowerCase();
      const today = new Date();
      const orderDate = new Date(order.created_at);
      let periodMatch = true;
      switch (activeFilters.period) {
        case 'today':
          periodMatch = orderDate.toDateString() === new Date().toDateString();
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          periodMatch = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setDate(today.getDate() - 30);
          periodMatch = orderDate >= monthAgo;
          break;
        case 'lastMonth':
          const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
          periodMatch = orderDate >= firstDayLastMonth && orderDate <= lastDayLastMonth;
          break;
        default:
          break;
      }
      return statusMatch && periodMatch;
    });
  };

  const handleDropdownSelect = (type, value) => {
    setActiveFilters(prev => ({ ...prev, [type]: value }));
    setDropdownOpen(false);
    setPage(1);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSummary(activeFilters.period);
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

  const filteredOrders = applyFilters(pedidos);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content-row">
          <h1>Dashboard</h1>
          <button className="filter-icon-btn" onClick={() => setDropdownOpen(v => !v)} aria-label="Filtrar">
            <FaFilter />
          </button>
          {dropdownOpen && (
            <div className="filter-dropdown" ref={dropdownRef}>
              <div className="dropdown-group">
                <div className="dropdown-label">Status do Pedido</div>
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`dropdown-item${activeFilters.status === opt.value ? ' selected' : ''}`}
                    onClick={() => handleDropdownSelect('status', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="dropdown-group">
                <div className="dropdown-label">Período</div>
                {periodOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`dropdown-item${activeFilters.period === opt.value ? ' selected' : ''}`}
                    onClick={() => handleDropdownSelect('period', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>Pedidos</h3>
            <div className="stat-value">{filteredOrders.length}</div>
            <p className="stat-label">Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Faturamento</h3>
            <div className="stat-value">
              {formatCurrency(filteredOrders.filter(pedido => {
                const status = (pedido.status || '').toLowerCase();
                return status !== 'cancelled' && status !== 'cancelado';
              }).reduce((acc, pedido) => acc + (Number(pedido.total_amount) || 0), 0))}
            </div>
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
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
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
                    Nenhum pedido encontrado
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
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardRestaurante; 