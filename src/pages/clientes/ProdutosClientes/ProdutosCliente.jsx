import React, { useState, useEffect } from 'react';
import './produtoCliente.css';
import PersonalizarProdutoModal from './PersonalizarProduto/PersonalizarProdutoModal';
import { produtosClienteService } from '../../../services/clientes/produtosCliente';

const ProdutosCliente = ({ onAdicionarAoCarrinho }) => {
  const [categoriaAtual, setCategoriaAtual] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para formatar o preço
  const formatarPreco = (preco) => {
    const precoNumerico = typeof preco === 'string' ? parseFloat(preco) : preco;
    return precoNumerico.toFixed(2);
  };

  // Carregar categorias e produtos iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        // Carregar categorias
        const responseCategorias = await produtosClienteService.getCategorias();
        const categoriasFormatadas = responseCategorias.data.results || responseCategorias.data;
        setCategorias([
          { id: 'todos', name: 'Todos' },
          ...categoriasFormatadas
        ]);

        // Carregar produtos
        const responseProdutos = await produtosClienteService.getProdutos();
        const produtosFormatados = responseProdutos.data.results || responseProdutos.data;
        setProdutos(produtosFormatados);
      } catch (err) {
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Carregar produtos quando mudar a categoria
  useEffect(() => {
    const carregarProdutosPorCategoria = async () => {
      try {
        setLoading(true);
        let response;
        if (categoriaAtual === 'todos') {
          response = await produtosClienteService.getProdutos();
        } else {
          response = await produtosClienteService.getProdutosPorCategoria(categoriaAtual);
        }
        const produtosFormatados = response.data.results || response.data;
        setProdutos(produtosFormatados);
      } catch (err) {
        setError('Erro ao carregar os produtos. Por favor, tente novamente.');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutosPorCategoria();
  }, [categoriaAtual]);

  const handleAbrirModal = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
  };

  const handleAdicionarPersonalizado = (produtoPersonalizado) => {
    onAdicionarAoCarrinho(produtoPersonalizado);
  };

  if (loading) {
    return <div className="produtos-cliente-container">Carregando...</div>;
  }

  if (error) {
    return <div className="produtos-cliente-container">{error}</div>;
  }

  return (
    <div className="produtos-cliente-container">
      <div className="produtos-cliente-categorias">
        {categorias.map(categoria => (
          <button
            key={categoria.id}
            className={`produtos-cliente-categoria-btn ${categoriaAtual === categoria.id ? 'produtos-cliente-categoria-btn--ativo' : ''}`}
            onClick={() => setCategoriaAtual(categoria.id)}
          >
            {categoria.name}
          </button>
        ))}
      </div>

      <div className="produtos-cliente-grid">
        {produtos.map(produto => (
          <div key={produto.id} className="produtos-cliente-card" onClick={() => handleAbrirModal(produto)} style={{cursor: 'pointer'}}>
            <img 
              src={produto.image || "https://via.placeholder.com/150"} 
              alt={produto.name} 
              className="produtos-cliente-card__imagem"
            />
            <div className="produtos-cliente-card__info">
              <h3 className="produtos-cliente-card__titulo">{produto.name}</h3>
              <p className="produtos-cliente-card__descricao">{produto.description}</p>
              <div className="produtos-cliente-card__footer">
                <span className="produtos-cliente-card__preco">
                  R$ {formatarPreco(produto.price)}
                </span>
                <button 
                  className="produtos-cliente-card__btn-adicionar"
                  style={{pointerEvents: 'none', opacity: 0.5}}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <PersonalizarProdutoModal
        produto={produtoSelecionado}
        aberto={modalAberto}
        onFechar={handleFecharModal}
        onAdicionar={handleAdicionarPersonalizado}
      />
    </div>
  );
};

export default ProdutosCliente;
