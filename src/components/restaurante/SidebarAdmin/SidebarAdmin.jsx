import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaList, FaUsers, FaCog, FaShoppingBag, FaClipboardList, FaSignOutAlt, FaGift } from 'react-icons/fa';
import './sidebarAdmin.css';
import authService from '../../../services/authService';

const SidebarAdmin = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/restaurante/dashboard',
      icon: <FaHome />,
      label: 'Painel'
    },
    {
      path: '/restaurante/categorias',
      icon: <FaList />,
      label: 'Categorias'
    },
    {
      path: '/restaurante/produtos',
      icon: <FaShoppingBag />,
      label: 'Produtos'
    },
    {
      path: '/restaurante/pedidos',
      icon: <FaClipboardList />,
      label: 'Pedidos'
    },
    {
      path: '/restaurante/promocoes',
      icon: <FaGift />,
      label: 'Promoções'
    },
    {
      path: '/restaurante/configuracoes',
      icon: <FaCog />,
      label: 'Configurações'
    }
  ];

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Restaurante</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        className="sidebar-logout-mobile"
        onClick={handleLogout}
        aria-label="Sair"
      >
        <FaSignOutAlt />
      </button>
    </div>
  );
};

export default SidebarAdmin;
