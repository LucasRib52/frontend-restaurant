import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { restauranteRoutes } from './pages/restaurante/routes';
import { clientesRoutes } from './pages/clientes/routesClientes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz que redireciona para /restaurante */}
        <Route path="/" element={<Navigate to="/restaurante" replace />} />
        
        {/* Rotas do restaurante */}
        {restauranteRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element}>
            {route.children?.map((child) => (
              <Route
                key={child.path || 'index'}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}

        {/* Rotas dos clientes */}
        {clientesRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Rota para qualquer caminho não encontrado */}
        <Route path="*" element={<Navigate to="/restaurante" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
