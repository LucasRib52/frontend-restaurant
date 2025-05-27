import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './homeclientes.css';
import ProdutosCliente from '../../../pages/clientes/ProdutosClientes/ProdutosCliente';
import CarrinhoCliente from '../../../pages/clientes/CarrinhoClientes/CarrinhoCliente';
import configuracaoRestauranteService from '../../../services/configuracaorestaurante';
import { MdLocationOn, MdPhone, MdEmail, MdLocalShipping, MdHolidayVillage, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md';

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
  const isCartPage = location.pathname === '/clientes/carrinho';

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

  const isOpenNow = (horario) => {
    if (!horario) return false;
    const now = new Date();
    const [hOpen, mOpen] = horario.opening_time.split(':').map(Number);
    const [hClose, mClose] = horario.closing_time.split(':').map(Number);
    const open = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hOpen, mOpen);
    const close = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hClose, mClose);
    return now >= open && now <= close && !horario.is_holiday;
  };

  // Lógica para horários
  const hojeIdx = configuracao?.opening_hours ? getHojeIndex() : null;
  const horarioHoje = configuracao?.opening_hours ? configuracao.opening_hours[hojeIdx] : null;
  const abertoAgora = horarioHoje && isOpenNow(horarioHoje);

  return (
    <div className="home-clientes-container">
      {/* Novo header tipo cardápio digital */}
      <header className="home-clientes-header-modern">
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
              {configuracao.opening_hours.map((hora, idx) => {
                const isHoje = idx === hojeIdx;
                return (
                  <li key={hora.id} className={`horario-badge-modern${isHoje ? ' horario-badge-modern-hoje' : ''}`}> 
                    <span className="horario-dia-modern">{DIAS_SEMANA[hora.day_of_week]}</span>
                    <span className="horario-horas-modern">{hora.opening_time} às {hora.closing_time}</span>
                    {hora.is_holiday && <span className="horario-badge-modern-feriado"><MdHolidayVillage style={{verticalAlign:'middle',marginRight:2}}/>Feriado</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>
      {/* Área principal do cardápio */}
      <main className="home-clientes-cardapio">
        <h2 className="home-clientes-cardapio__titulo">Cardápio</h2>
        <ProdutosCliente onAdicionarAoCarrinho={adicionarAoCarrinho} />
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
