import React, { useState, useEffect } from 'react';
import './personalizarProdutoModal.css';
import { produtosClienteService } from '../../../../services/clientes/produtosCliente';

const PersonalizarProdutoModal = ({ produto, aberto, onFechar, onAdicionar, etapaPromocao }) => {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selecoes, setSelecoes] = useState({});

  useEffect(() => {
    const carregarIngredientes = async () => {
      try {
        setLoading(true);
        const response = await produtosClienteService.getProduto(produto.id);
        const ingredientesDoProduto = response.data.ingredients || [];
        
        // Agrupar ingredientes por grupo_name do backend
        const ingredientesAgrupados = ingredientesDoProduto.reduce((acc, item) => {
          const grupo = item.group_name || 'Outros';
          if (!acc[grupo]) {
            acc[grupo] = [];
          }
          acc[grupo].push({
            id: item.ingredient.id,
            name: item.ingredient.name,
            price: parseFloat(item.ingredient.price),
            isRequired: item.is_required,
            maxQuantity: item.max_quantity
          });
          return acc;
        }, {});

        setIngredientes(ingredientesAgrupados);
        
        // Inicializar seleções
        const selecoesIniciais = {};
        Object.keys(ingredientesAgrupados).forEach(categoria => {
          ingredientesAgrupados[categoria].forEach(ing => {
            selecoesIniciais[ing.id] = 0;
          });
        });
        setSelecoes(selecoesIniciais);
      } catch (err) {
        setError('Erro ao carregar os ingredientes. Por favor, tente novamente.');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    if (produto) {
      carregarIngredientes();
    }
  }, [produto]);

  const handleQuantidadeChange = (ingredienteId, quantidade) => {
    const ingrediente = Object.values(ingredientes)
      .flat()
      .find(ing => ing.id === ingredienteId);

    if (ingrediente) {
      const novaQuantidade = Math.max(0, Math.min(quantidade, ingrediente.maxQuantity));
      setSelecoes(prev => ({
        ...prev,
        [ingredienteId]: novaQuantidade
      }));
    }
  };

  const calcularPrecoTotal = () => {
    const precoBase = parseFloat(produto.price);
    const precoIngredientes = Object.entries(selecoes).reduce((total, [ingredienteId, quantidade]) => {
      const ingrediente = Object.values(ingredientes)
        .flat()
        .find(ing => ing.id === parseInt(ingredienteId));
      return total + (ingrediente ? ingrediente.price * quantidade : 0);
    }, 0);

    return (precoBase + precoIngredientes).toFixed(2);
  };

  const verificarSePodeAdicionar = () => {
    return Object.entries(ingredientes).every(([categoria, ings]) => {
      const grupoObrigatorio = ings.some(ing => ing.isRequired);
      if (!grupoObrigatorio) return true;
      // Pelo menos 1 selecionado no grupo obrigatório
      return ings.some(ing => selecoes[ing.id]);
    });
  };

  const handleAdicionar = () => {
    if (!verificarSePodeAdicionar()) return;

    const ingredientesSelecionados = Object.entries(selecoes)
      .filter(([_, quantidade]) => quantidade > 0)
      .map(([ingredienteId, quantidade]) => {
        const ingrediente = Object.values(ingredientes)
          .flat()
          .find(ing => ing.id === parseInt(ingredienteId));
        return {
          id: ingrediente.id,
          name: ingrediente.name,
          price: ingrediente.price,
          quantity: quantidade
        };
      });

    onAdicionar({
      ...produto,
      ingredientes: ingredientesSelecionados,
      price: parseFloat(calcularPrecoTotal())
    });
    if (!etapaPromocao) {
      onFechar();
    }
  };

  // Função para saber se o grupo é escolha única (radio) ou múltipla (checkbox)
  const isGrupoEscolhaUnica = (ings, maxQuantidade) => maxQuantidade === 1;

  const handleSelecionar = (categoria, ingredienteId, checked, maxQuantidade) => {
    setSelecoes(prev => {
      const novo = { ...prev };
      const selecionados = Object.entries(novo)
        .filter(([id, v]) => ingredientes[categoria].some(ing => ing.id === parseInt(id)) && v)
        .map(([id]) => parseInt(id));
      if (isGrupoEscolhaUnica(ingredientes[categoria], maxQuantidade)) {
        // Radio: desmarcar todos e marcar só o escolhido
        ingredientes[categoria].forEach(ing => {
          novo[ing.id] = 0;
        });
        novo[ingredienteId] = checked ? 1 : 0;
      } else {
        // Checkbox: só permite até o máximo
        if (checked) {
          if (selecionados.length < maxQuantidade) {
            novo[ingredienteId] = 1;
          }
        } else {
          novo[ingredienteId] = 0;
        }
      }
      return novo;
    });
  };

  if (!aberto || !produto) return null;

  if (loading) {
    return (
      <div className="personalizar-modal-overlay">
        <div className="personalizar-modal">
          <div className="personalizar-modal__body">
            <p>Carregando ingredientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personalizar-modal-overlay">
        <div className="personalizar-modal">
          <div className="personalizar-modal__body">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="personalizar-modal-overlay" onClick={onFechar}>
      <div className="personalizar-modal" onClick={e => e.stopPropagation()}>
        <div className="personalizar-modal__header">
          {etapaPromocao ? (
            <>
              {etapaPromocao.isBrinde ? (
                <h2>Personalize seu brinde</h2>
              ) : (
                <h2>Personalize sua salada {etapaPromocao.atual} de {etapaPromocao.total}</h2>
              )}
            </>
          ) : (
            <h2>Personalizar {produto.name}</h2>
          )}
          <button className="personalizar-modal__fechar" onClick={onFechar}>×</button>
        </div>
        <div className="personalizar-modal__body">
          {Object.entries(ingredientes).map(([categoria, ingredientesCategoria]) => {
            const maxQuantidade = ingredientesCategoria[0]?.maxQuantity || 1;
            const grupoObrigatorio = ingredientesCategoria.some(ing => ing.isRequired);
            const escolhaUnica = isGrupoEscolhaUnica(ingredientesCategoria, maxQuantidade);
            const selecionados = ingredientesCategoria.filter(ing => selecoes[ing.id]).length;
            return (
              <div key={categoria} className="personalizar-modal__grupo">
                <div className="personalizar-modal__grupo-header">
                  <h4>
                    {categoria}
                    {grupoObrigatorio && <span className="obrigatorio">*</span>}
                  </h4>
                  <div className="personalizar-modal__grupo-info">
                    {grupoObrigatorio && <span className="grupo-obrigatorio">Obrigatório</span>}
                    <span className="grupo-quantidade">Escolha até {maxQuantidade} {maxQuantidade === 1 ? 'item' : 'itens'} ({selecionados}/{maxQuantidade} selecionado{maxQuantidade > 1 ? 's' : ''})</span>
                  </div>
                </div>
                {ingredientesCategoria.map(ingrediente => {
                  const checked = !!selecoes[ingrediente.id];
                  const disabled = !checked && selecionados >= maxQuantidade;
                  return (
                    <div
                      key={ingrediente.id}
                      className="personalizar-modal__opcao"
                      onClick={() => {
                        if (!disabled) handleSelecionar(categoria, ingrediente.id, !checked, maxQuantidade);
                      }}
                      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                    >
                      {ingrediente.image && (
                        <img src={ingrediente.image} alt={ingrediente.name} className="ingrediente-imagem" />
                      )}
                      <div className="ingrediente-info">
                        <div className="ingrediente-nome">{ingrediente.name}</div>
                        {ingrediente.description && <div className="ingrediente-descricao">{ingrediente.description}</div>}
                        {ingrediente.price > 0 && <div className="ingrediente-preco">+ R$ {ingrediente.price.toFixed(2)}</div>}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {}}
                        className="ingrediente-checkbox radio-style"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="personalizar-modal__footer">
          <button
            className="personalizar-modal__adicionar"
            disabled={!verificarSePodeAdicionar()}
            onClick={handleAdicionar}
          >
            Adicionar ao carrinho — R$ {calcularPrecoTotal()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizarProdutoModal; 