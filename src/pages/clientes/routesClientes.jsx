import HomeClientes from '../../components/clientes/HomeClientes/HomeClientes';
import CarrinhoCliente from './CarrinhoClientes/CarrinhoCliente';
import FinalizarPedido from './FinalizarPedido/FinalizarPedido';

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
  }
];
