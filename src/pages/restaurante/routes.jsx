import React from 'react';
import DashboardRestaurante from './DashboardRestaurante/DashboardRestaurante';
import Categoria from './CategoriaRestaurante/Categoria';
import LayoutAdmin from '../../components/restaurante/LayoutAdmin/LayoutAdmin';
import ProdutoRestaurante from './ProdutoRestaurante/ProdutoRestaurante';
import PedidosRestaurante from './PedidosRestaurante/PedidosRestaurante';
import ConfiguracaoRestaurante from './ConfiguracaoRestaurante/Configuracao';
import PrivateRoute from '../../components/PrivateRoute';
import Login from '../login/Login';

export const restauranteRoutes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/restaurante',
    element: (
      <PrivateRoute>
        <LayoutAdmin />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardRestaurante />
      },
      {
        path: 'dashboard',
        element: <DashboardRestaurante />
      },
      {
        path: 'categorias',
        element: <Categoria />
      },
      {
        path: 'produtos',
        element: <ProdutoRestaurante />
      },
      {
        path: 'pedidos',
        element: <PedidosRestaurante />
      },
      {
        path: 'configuracoes',
        element: <ConfiguracaoRestaurante />
      },
    ]
  }
]; 