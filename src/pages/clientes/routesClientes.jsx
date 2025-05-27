import HomeClientes from '../../components/clientes/HomeClientes/HomeClientes';
import CarrinhoCliente from './CarrinhoClientes/CarrinhoCliente';
import FinalizarPedido from './FinalizarPedido/FinalizarPedido';
import MeusPedidosCliente from './MeusPedidosCliente/MeusPedidosCliente';

export const clientesRoutes = [
  {
    path: '/clientes',
    element: <HomeClientes />,
  },
  {
    path: '/clientes/carrinho',
    element: <CarrinhoCliente />,
  },
  {
    path: '/clientes/finalizar-pedido',
    element: <FinalizarPedido />,
  },
  {
    path: '/clientes/meus-pedidos',
    element: <MeusPedidosCliente />,
  }
];
