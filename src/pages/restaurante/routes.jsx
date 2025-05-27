import React from 'react';
import DashboardRestaurante from './DashboardRestaurante/DashboardRestaurante';
import Categoria from './CategoriaRestaurante/Categoria';
import LayoutAdmin from '../../components/restaurante/LayoutAdmin/LayoutAdmin';
import ProdutoRestaurante from './ProdutoRestaurante/ProdutoRestaurante';
import PedidosRestaurante from './PedidosRestaurante/PedidosRestaurante';
import ConfiguracaoRestaurante from './ConfiguracaoRestaurante/Configuracao';

export const restauranteRoutes = [
  {
    path: '/restaurante',
    element: <LayoutAdmin />,
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