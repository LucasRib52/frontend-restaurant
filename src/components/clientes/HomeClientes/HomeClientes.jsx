import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './homeclientes.css';
import ProdutosCliente from '../../../pages/clientes/ProdutosClientes/ProdutosCliente';
import CarrinhoCliente from '../../../pages/clientes/CarrinhoClientes/CarrinhoCliente';
import configuracaoRestauranteService from '../../../services/configuracaorestaurante';
import promotionService from '../../../services/promotionService';
import { MdLocationOn, MdPhone, MdEmail, MdLocalShipping, MdAccessTime, MdCheckCircle, MdCancel, MdReceipt, MdHolidayVillage, MdShoppingCart, MdLocalOffer, MdCardGiftcard } from 'react-icons/md';
import { formatCurrency } from '@/utils/formatters';
import PersonalizarProdutoModal from '../../../pages/clientes/ProdutosClientes/PersonalizarProduto/PersonalizarProdutoModal';

const DIAS_SEMANA = {
  0: 'Segunda',
  1: 'Terça',
  2: 'Quarta',
  3: 'Quinta',
  4: 'Sexta',
  5: 'Sábado',
  6: 'Domingo'
};

const HomeClientes = () => {
  const [configuracao, setConfiguracao] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isCartPage = location.pathname === '/clientes/carrinho';
  const [promocoes, setPromocoes] = useState([]);
  const [loadingPromocoes, setLoadingPromocoes] = useState(true);

  // Estado para fluxo de personalização de promoção
  const [personalizandoPromocao, setPersonalizandoPromocao] = useState(null); // { promo, etapas: [], etapaAtual: 0, personalizados: [] }
  const [personalizarModalAberto, setPersonalizarModalAberto] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState(null);
  const [escolhendoBrinde, setEscolhendoBrinde] = useState(false);
  const [brindeEscolhido, setBrindeEscolhido] = useState(null);

  useEffect(() => {
    const carregarConfiguracao = async () => {
      try {
        const response = await configuracaoRestauranteService.get();
        setConfiguracao(response.data);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    carregarConfiguracao();
  }, []);

  useEffect(() => {
    const carregarPromocoes = async () => {
      try {
        setLoadingPromocoes(true);
        const data = await promotionService.listPromotions();
        setPromocoes(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        setPromocoes([]);
      } finally {
        setLoadingPromocoes(false);
      }
    };
    carregarPromocoes();
  }, []);

  // Carregar carrinho do localStorage ao iniciar
  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem('carrinhoCliente');
    return salvo ? JSON.parse(salvo) : [];
  });

  // Sempre que o carrinho mudar, salvar no localStorage
  useEffect(() => {
    localStorage.setItem('carrinhoCliente', JSON.stringify(carrinho));
  }, [carrinho]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho.find(item => item.id === produto.id && JSON.stringify(item.adicionais) === JSON.stringify(produto.adicionais) && item.proteina === produto.proteina && item.molho === produto.molho);
      let novoCarrinho;
      if (itemExistente) {
        novoCarrinho = prevCarrinho.map(item =>
          item === itemExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        novoCarrinho = [...prevCarrinho, { ...produto, quantidade: 1 }];
      }
      localStorage.setItem('carrinhoCliente', JSON.stringify(novoCarrinho));
      console.log('Salvando carrinho no localStorage:', novoCarrinho);
      return novoCarrinho;
    });
  };

  const removerDoCarrinho = (index) => {
    setCarrinho(prevCarrinho => {
      const novoCarrinho = prevCarrinho.filter((_, i) => i !== index);
      localStorage.setItem('carrinhoCliente', JSON.stringify(novoCarrinho));
      console.log('Removendo item, novo carrinho:', novoCarrinho);
      return novoCarrinho;
    });
  };

  const atualizarQuantidade = (index, novaQuantidade) => {
    if (novaQuantidade < 1) return;
    setCarrinho(prevCarrinho => {
      const novoCarrinho = prevCarrinho.map((item, i) =>
        i === index ? { ...item, quantidade: novaQuantidade } : item
      );
      localStorage.setItem('carrinhoCliente', JSON.stringify(novoCarrinho));
      console.log('Atualizando quantidade, novo carrinho:', novoCarrinho);
      return novoCarrinho;
    });
  };

  const getHojeIndex = () => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  const isOpenNow = (horarios) => {
    if (!horarios || horarios.length === 0) return false;
    const now = new Date();
    const current_time = now.toTimeString().slice(0, 5); // HH:mm
    const current_day = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Domingo, 1=Segunda...

    // Filtra só os horários do dia atual ou do dia anterior (se fechar no dia seguinte)
    const horariosRelevantes = horarios.filter(horario => {
      if (!horario.is_open || horario.is_holiday) return false;
      
      const horarioDay = Number(horario.day_of_week);
      const horarioAbertura = horario.opening_time;
      const horarioFechamento = horario.closing_time;

      // Se o horário fecha no dia seguinte (next_day_closing)
      if (horario.next_day_closing) {
        // Se estamos no dia da abertura
        if (current_day === horarioDay) {
          return current_time >= horarioAbertura;
        }
        // Se estamos no dia do fechamento
        else if (current_day === (horarioDay + 1) % 7) {
          return current_time <= horarioFechamento;
        }
        return false;
      } else {
        // Se o fechamento é no mesmo dia
        if (current_day === horarioDay) {
          // Se o horário de abertura é maior que o de fechamento (ex: 18:00 > 09:30)
          // significa que o período começa no dia anterior
          if (horarioAbertura > horarioFechamento) {
            return current_time >= horarioAbertura || current_time <= horarioFechamento;
          }
          // Horário normal no mesmo dia
          return current_time >= horarioAbertura && current_time <= horarioFechamento;
        }
        return false;
      }
    });

    return horariosRelevantes.length > 0;
  };

  // Lógica para horários
  const abertoAgora = configuracao?.opening_hours ? isOpenNow(configuracao.opening_hours) : false;

  // Função para iniciar o fluxo de personalização de promoção
  const iniciarPersonalizacaoPromocao = (promo) => {
    // Expandir os itens conforme a quantidade
    const etapasProdutos = promo.items.flatMap(item =>
      Array.from({ length: item.quantity }).map(() => ({ ...item.product, quantidade: 1 }))
    );
    setPersonalizandoPromocao({
      promo,
      etapas: etapasProdutos,
      etapaAtual: 0,
      personalizados: []
    });
    setProdutoAtual(etapasProdutos[0]);
    setPersonalizarModalAberto(true);
    setEscolhendoBrinde(false);
    setBrindeEscolhido(null);
  };

  // Função chamada ao finalizar a personalização de um produto da promoção
  const handlePersonalizarProdutoPromo = (produtoPersonalizado) => {
    setPersonalizandoPromocao(prev => {
      if (!prev) return null;
      const { promo, etapas, etapaAtual, personalizados } = prev;
      const novosPersonalizados = [...personalizados, produtoPersonalizado];
      const proximaEtapa = etapaAtual + 1;
      if (proximaEtapa < etapas.length) {
        // Personalizar próximo produto
        setProdutoAtual(etapas[proximaEtapa]);
        setPersonalizarModalAberto(true);
        return { ...prev, etapaAtual: proximaEtapa, personalizados: novosPersonalizados };
      } else if (promo.rewards && promo.rewards.length > 1 && !brindeEscolhido) {
        // Se há mais de um brinde, abrir escolha de brinde
        setEscolhendoBrinde(true);
        setPersonalizarModalAberto(false);
        return { ...prev, etapaAtual: proximaEtapa, personalizados: novosPersonalizados };
      } else if ((promo.rewards && promo.rewards.length === 1) || brindeEscolhido) {
        // Se já personalizou o brinde, finalizar fluxo
        if (etapaAtual >= etapas.length) {
          // Adiciona ao carrinho um único item de promoção
          adicionarAoCarrinho({
            tipo: 'promocao',
            promocaoId: promo.id,
            name: promo.name,
            description: promo.description,
            produtos: novosPersonalizados.slice(0, etapas.length),
            brinde: novosPersonalizados.length > etapas.length ? novosPersonalizados[novosPersonalizados.length - 1] : null,
            price: promo.price,
            quantidade: 1
          });
          setPersonalizarModalAberto(false);
          setPersonalizandoPromocao(null);
          setProdutoAtual(null);
          setEscolhendoBrinde(false);
          setBrindeEscolhido(null);
          return null;
        }
        // Personalizar o brinde escolhido (ou único)
        const brinde = brindeEscolhido ? promo.rewards.find(r => r.product.id === brindeEscolhido) : promo.rewards[0];
        if (brinde) {
          setProdutoAtual({ ...brinde.product, quantidade: 1 });
          setPersonalizarModalAberto(true);
          setEscolhendoBrinde(false);
          return { ...prev, etapaAtual: proximaEtapa, personalizados: novosPersonalizados };
        }
      }
      // Fallback: finaliza
      adicionarAoCarrinho({
        tipo: 'promocao',
        promocaoId: promo.id,
        name: promo.name,
        description: promo.description,
        produtos: novosPersonalizados.slice(0, etapas.length),
        brinde: novosPersonalizados.length > etapas.length ? novosPersonalizados[novosPersonalizados.length - 1] : null,
        price: promo.price,
        quantidade: 1
      });
      setPersonalizarModalAberto(false);
      setPersonalizandoPromocao(null);
      setProdutoAtual(null);
      setEscolhendoBrinde(false);
      setBrindeEscolhido(null);
      return null;
    });
  };

  // Função para escolher o brinde
  const handleEscolherBrinde = (productId) => {
    setBrindeEscolhido(productId);
    // Após escolher, abrir personalização do brinde
    setProdutoAtual(personalizandoPromocao.promo.rewards.find(r => r.product.id === productId).product);
    setPersonalizarModalAberto(true);
    setEscolhendoBrinde(false);
  };

  return (
    <div className="home-clientes-container">
      {/* Novo header tipo cardápio digital */}
      <header className="home-clientes-header-modern">
        <div className="meus-pedidos-top-btn-wrapper">
          <button 
            className="meus-pedidos-top-btn" 
            onClick={() => navigate('/clientes/meus-pedidos')}
          >
            <MdReceipt style={{marginRight: 8, fontSize: 22}}/> Meus Pedidos
          </button>
        </div>
        <div className="header-main-row">
          {configuracao?.business_photo && (
            <img 
              src={configuracao.business_photo} 
              alt={configuracao.business_name} 
              className="home-clientes-header__logo-modern"
            />
          )}
          <div className="header-main-info">
            <h1 className="home-clientes-header__titulo-modern">{configuracao?.business_name || 'Nome da Empresa'}</h1>
            <div className="header-main-infos-row">
              <span className="header-info-item"><MdLocationOn/> {configuracao?.business_address || 'Endereço da Empresa'}</span>
              <span className="header-info-item"><MdPhone/> {configuracao?.business_phone || 'Telefone: (00) 0000-0000'}</span>
              <span className="header-info-item"><MdEmail/> {configuracao?.business_email || 'Email da Empresa'}</span>
              {configuracao?.delivery_available && <span className="header-info-item"><MdLocalShipping/> Delivery</span>}
            </div>
          </div>
        </div>
        {/* Card de horários */}
        {configuracao?.opening_hours && (
          <div className="horarios-card">
            <div className="horarios-card-status-row">
              {abertoAgora ? (
                <span className="horarios-card-aberto"><MdCheckCircle style={{verticalAlign:'middle',marginRight:6}}/>ABERTO AGORA</span>
              ) : (
                <span className="horarios-card-fechado"><MdCancel style={{verticalAlign:'middle',marginRight:6}}/>FECHADO</span>
              )}
            </div>
            <div className="horarios-card-title-row">
              <MdAccessTime style={{verticalAlign:'middle',marginRight:6}}/>
              <span className="horarios-card-title">Horários de Funcionamento</span>
            </div>
            <ul className="horarios-badges-list-modern">
              {Object.entries(DIAS_SEMANA).map(([diaIdx, diaNome]) => {
                const horario = configuracao.opening_hours.find(h => Number(h.day_of_week) === Number(diaIdx));
                const isHoje = getHojeIndex() === Number(diaIdx);
                return (
                  <li key={diaIdx} className={`horario-badge-modern${isHoje ? ' horario-badge-modern-hoje' : ''}`}> 
                    <span className="horario-dia-modern">{diaNome}</span>
                    {horario && horario.is_open && !horario.is_holiday ? (
                      <span className="horario-horas-modern">{horario.opening_time} às {horario.closing_time}</span>
                    ) : (
                      <span className="horario-horas-modern">Fechado</span>
                    )}
                    {horario && horario.is_holiday && <span className="horario-badge-modern-feriado"><MdHolidayVillage style={{verticalAlign:'middle',marginRight:2}}/>Feriado</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* PROMOÇÕES */}
      <div className="promocoes-clientes-list">
        <h2>Promoções Especiais</h2>
        {loadingPromocoes ? (
          <div className="promocao-card__loading">
            <div>Carregando promoções...</div>
          </div>
        ) : promocoes.length === 0 ? (
          <div className="promocao-card__empty">
            <MdLocalOffer style={{ fontSize: 24, marginBottom: 8, color: '#666' }} />
            <p>Nenhuma promoção ativa no momento.</p>
          </div>
        ) : (
          <div className="promocoes-grid">
            {promocoes.map((promo) => (
              <div key={promo.id} className="promocao-card">
                {promo.image && (
                  <div className="promocao-card__image-wrapper">
                    <img 
                      src={promo.image} 
                      alt={promo.name}
                      className="promocao-card__image"
                    />
                  </div>
                )}
                <div className="promocao-card__content">
                  <div className="promocao-card__header">
                    <h3 className="promocao-card__title">{promo.name}</h3>
                    <p className="promocao-card__description">{promo.description}</p>
                  </div>

                  <div className="promocao-card__price-row">
                    <span className="promocao-card__price">{formatCurrency(promo.price)}</span>
                    <span className="promocao-card__savings">
                      Economia de {formatCurrency(promo.savings_amount)}
                    </span>
                  </div>
                  
                  <div className="promocao-card__items">
                    <div className="promocao-card__items-title">
                      <MdShoppingCart style={{ fontSize: 20 }} />
                      Inclui
                    </div>
                    <ul className="promocao-card__items-list">
                      {promo.items?.map(item => (
                        <li key={item.id}>
                          {item.quantity}x {item.product?.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {promo.rewards?.length > 0 && (
                    <div className="promocao-card__items">
                      <div className="promocao-card__items-title">
                        <MdCardGiftcard style={{ fontSize: 20 }} />
                        Brindes
                      </div>
                      <ul className="promocao-card__items-list">
                        {promo.rewards.map(reward => (
                          <li key={reward.id}>{reward.product?.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    className="promocao-card__button"
                    onClick={() => iniciarPersonalizacaoPromocao(promo)}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE ESCOLHA DE BRINDE */}
      {personalizandoPromocao && escolhendoBrinde && personalizandoPromocao.promo.rewards?.length > 1 && (
        <div className="personalizar-modal-overlay" style={{zIndex: 9999}}>
          <div className="personalizar-modal" style={{maxWidth: 400}}>
            <div className="personalizar-modal__header">
              <h2>Escolha seu brinde</h2>
              <button className="personalizar-modal__fechar" onClick={() => {
                setEscolhendoBrinde(false);
                setPersonalizandoPromocao(null);
                setProdutoAtual(null);
                setBrindeEscolhido(null);
              }}>×</button>
            </div>
            <div className="personalizar-modal__body">
              {personalizandoPromocao.promo.rewards.map(reward => (
                <button
                  key={reward.id}
                  style={{ display: 'block', width: '100%', margin: '12px 0', padding: 16, borderRadius: 8, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}
                  onClick={() => handleEscolherBrinde(reward.product.id)}
                >
                  {reward.product?.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERSONALIZAÇÃO DE PROMOÇÃO */}
      {personalizandoPromocao && produtoAtual && !escolhendoBrinde && (
        <PersonalizarProdutoModal
          produto={produtoAtual}
          aberto={personalizarModalAberto}
          onFechar={() => {
            setPersonalizarModalAberto(false);
            setPersonalizandoPromocao(null);
            setProdutoAtual(null);
            setEscolhendoBrinde(false);
            setBrindeEscolhido(null);
          }}
          onAdicionar={handlePersonalizarProdutoPromo}
          etapaPromocao={(() => {
            if (!personalizandoPromocao) return undefined;
            const { etapas, etapaAtual, promo } = personalizandoPromocao;
            // Se está personalizando brinde
            if (promo.rewards && promo.rewards.length > 0 && etapaAtual >= etapas.length) {
              return { atual: 1, total: 1, isBrinde: true };
            }
            // Personalizando produto
            return { atual: etapaAtual + 1, total: etapas.length, isBrinde: false };
          })()}
        />
      )}

      {/* Área principal do cardápio */}
      <main className="home-clientes-cardapio">
        <h2 className="home-clientes-cardapio__titulo">Cardápio</h2>
        <ProdutosCliente onAdicionarAoCarrinho={adicionarAoCarrinho} abertoAgora={abertoAgora} />
      </main>
      {/* Carrinho de compras - só mostra se não estiver na página do carrinho */}
      {!isCartPage && (
        <footer className="home-clientes-carrinho">
          <CarrinhoCliente 
            itens={carrinho}
            onRemoverItem={removerDoCarrinho}
            onAtualizarQuantidade={atualizarQuantidade}
          />
        </footer>
      )}
    </div>
  );
};

export default HomeClientes;
