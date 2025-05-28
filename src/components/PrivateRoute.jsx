import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const isValid = await authService.verifyToken();
          setIsValid(isValid);
          if (!isValid) {
            authService.logout();
            navigate('/login', { replace: true });
          }
        } else {
          setIsValid(false);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Erro na verificação do token:', error);
        setIsValid(false);
        authService.logout();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    // Verifica imediatamente
    verifyAuth();

    // Configura verificação periódica a cada 5 segundos
    const intervalId = setInterval(verifyAuth, 5000);

    // Limpa o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [navigate]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute; 