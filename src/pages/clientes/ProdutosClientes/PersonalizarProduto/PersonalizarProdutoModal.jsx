import React, { useState, useEffect } from 'react';
import './personalizarProdutoModal.css';
import { produtosClienteService } from '../../../../services/clientes/produtosCliente';

const PersonalizarProdutoModal = ({ produto, aberto, onFechar, onAdicionar }) => {
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
        
        // Agrupar ingredientes por categoria
        const ingredientesAgrupados = ingredientesDoProduto.reduce((acc, item) => {
          const categoria = item.ingredient.category?.name || 'Outros';
          if (!acc[categoria]) {
            acc[categoria] = [];
          }
          acc[categoria].push({
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
            if (ing.isRequired) {
              selecoesIniciais[ing.id] = 1;
            } else {
              selecoesIniciais[ing.id] = 0;
            }
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
      return ings.every(ing => {
        if (ing.isRequired) {
          return selecoes[ing.id] > 0;
        }
        return true;
      });
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
    onFechar();
  };

  // Função para saber se o grupo é escolha única (radio) ou múltipla (checkbox)
  const isGrupoEscolhaUnica = (ings) => ings.every(ing => ing.maxQuantity === 1);

  const handleSelecionar = (categoria, ingredienteId, checked) => {
    setSelecoes(prev => {
      const novo = { ...prev };
      if (isGrupoEscolhaUnica(ingredientes[categoria])) {
        // Radio: desmarcar todos e marcar só o escolhido
        ingredientes[categoria].forEach(ing => {
          novo[ing.id] = 0;
        });
        novo[ingredienteId] = checked ? 1 : 0;
      } else {
        // Checkbox: marcar/desmarcar
        novo[ingredienteId] = checked ? 1 : 0;
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
          <h2>Personalizar {produto.name}</h2>
          <button className="personalizar-modal__fechar" onClick={onFechar}>×</button>
        </div>
        <div className="personalizar-modal__body">
          {Object.entries(ingredientes).map(([categoria, ingredientesCategoria]) => {
            const escolhaUnica = isGrupoEscolhaUnica(ingredientesCategoria);
            return (
              <div key={categoria} className="personalizar-modal__grupo">
                <h4>{categoria}</h4>
                {ingredientesCategoria.map(ingrediente => (
                  <div key={ingrediente.id} className="personalizar-modal__opcao" style={{gap: 12}}>
                    {ingrediente.image && (
                      <img src={ingrediente.image} alt={ingrediente.name} style={{width:36, height:36, borderRadius:8, objectFit:'cover', marginRight:10, background:'#f4f8fb'}} />
                    )}
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:600, color:'#23408e', fontSize:'1.05em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{ingrediente.name} {ingrediente.isRequired && <span className="obrigatorio">*</span>}</div>
                      {ingrediente.description && <div style={{color:'#888', fontSize:'0.93em'}}>{ingrediente.description}</div>}
                      {ingrediente.price > 0 && <div style={{color:'#28a745', fontWeight:500, fontSize:'0.97em'}}>+ R$ {ingrediente.price.toFixed(2)}</div>}
                    </div>
                    <input
                      type={escolhaUnica ? 'radio' : 'checkbox'}
                      name={categoria}
                      checked={!!selecoes[ingrediente.id]}
                      onChange={e => handleSelecionar(categoria, ingrediente.id, e.target.checked)}
                      style={{width:22, height:22, accentColor:'#23408e'}}
                    />
                  </div>
                ))}
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