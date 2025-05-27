import React, { useEffect, useState } from 'react';
import configuracaoRestauranteService from '../../../services/configuracaorestaurante';
import { MdAttachMoney, MdCreditCard, MdPix } from 'react-icons/md';
import { FaMoneyBillWave } from 'react-icons/fa';
import './configuracao.css';

const diasSemana = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

const ConfiguracaoRestaurante = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [edit, setEdit] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({
    dinheiro: false,
    cartao_debito: false,
    cartao_credito: false,
    pix: false,
    pix_key: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await configuracaoRestauranteService.get();
      setConfig(response.data);
      setHorarios(response.data.opening_hours || []);
      setLogoPreview(response.data.business_photo || null);
      
      // Inicializa os métodos de pagamento com os dados do servidor
      if (response.data.payment_methods) {
        setPaymentMethods({
          dinheiro: response.data.payment_methods.dinheiro || false,
          cartao_debito: response.data.payment_methods.cartao_debito || false,
          cartao_credito: response.data.payment_methods.cartao_credito || false,
          pix: response.data.payment_methods.pix || false,
          pix_key: response.data.payment_methods.pix_key || ''
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleHorarioChange = (idx, field, value) => {
    const novos = [...horarios];
    novos[idx][field] = value;
    setHorarios(novos);
  };

  const addHorario = () => {
    setHorarios([
      ...horarios,
      { day_of_week: 0, opening_time: '08:00', closing_time: '18:00', is_open: true, is_holiday: false }
    ]);
  };

  const removeHorario = (idx) => {
    setHorarios(horarios.filter((_, i) => i !== idx));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  const handlePixKeyChange = (e) => {
    setPaymentMethods(prev => ({
      ...prev,
      pix_key: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      
      // Campos básicos
      if (config.business_name) data.append('business_name', config.business_name);
      if (config.business_phone) data.append('business_phone', config.business_phone);
      if (config.business_address) data.append('business_address', config.business_address);
      if (config.business_email) data.append('business_email', config.business_email);
      
      // Logo
      if (logoFile) {
        data.append('business_photo', logoFile);
      }
      
      // Horários de funcionamento
      if (horarios.length > 0) {
        const horariosFormatados = horarios.map(h => ({
          day_of_week: parseInt(h.day_of_week) || 0,
          opening_time: h.opening_time || '08:00',
          closing_time: h.closing_time || '18:00',
          is_open: Boolean(h.is_open),
          is_holiday: Boolean(h.is_holiday)
        }));
        data.append('opening_hours', JSON.stringify(horariosFormatados));
      }

      // Métodos de pagamento
      const paymentMethodsData = {
        dinheiro: Boolean(paymentMethods.dinheiro),
        cartao_debito: Boolean(paymentMethods.cartao_debito),
        cartao_credito: Boolean(paymentMethods.cartao_credito),
        pix: Boolean(paymentMethods.pix),
        pix_key: paymentMethods.pix_key
      };
      data.append('payment_methods', JSON.stringify(paymentMethodsData));

      console.log('Enviando dados de pagamento:', paymentMethodsData); // Debug

      const response = await configuracaoRestauranteService.update(data, true);
      
      if (response.status === 200) {
        setSuccess('Configurações salvas com sucesso!');
        setEdit(false);
        setError(null);
        await fetchConfig(); // Recarrega as configurações após salvar
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.opening_hours || 
                          'Erro ao salvar configurações';
      setError(errorMessage);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="configuracao-restaurante-container">
      <div className="configuracao-restaurante-header">
        <h1>Configurações do Restaurante</h1>
        {!edit && config && (
          <button className="configuracao-restaurante-editar" onClick={() => setEdit(true)}>
            Editar
          </button>
        )}
      </div>
      {loading ? (
        <div className="configuracao-restaurante-loading">Carregando configurações...</div>
      ) : error ? (
        <div className="configuracao-restaurante-error">{error}</div>
      ) : success ? (
        <div className="configuracao-restaurante-success">{success}</div>
      ) : config ? (
        <form className="configuracao-restaurante-form" onSubmit={handleSubmit}>
          <div className="configuracao-restaurante-logo">
            <label>Logo do Restaurante</label>
            <div className="configuracao-restaurante-logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" />
              ) : (
                <div className="configuracao-restaurante-logo-placeholder">
                  <span>Sem logo</span>
                </div>
              )}
            </div>
            {edit && (
              <input type="file" accept="image/*" onChange={handleLogoChange} />
            )}
          </div>
          <div className="configuracao-restaurante-campo">
            <label>Nome do Restaurante</label>
            <input
              type="text"
              name="business_name"
              value={config.business_name || ''}
              onChange={handleChange}
              disabled={!edit}
              required
            />
          </div>
          <div className="configuracao-restaurante-campo">
            <label>Telefone</label>
            <input
              type="text"
              name="business_phone"
              value={config.business_phone || ''}
              onChange={handleChange}
              disabled={!edit}
            />
          </div>
          <div className="configuracao-restaurante-campo">
            <label>Endereço</label>
            <input
              type="text"
              name="business_address"
              value={config.business_address || ''}
              onChange={handleChange}
              disabled={!edit}
            />
          </div>
          <div className="configuracao-restaurante-campo">
            <label>Email</label>
            <input
              type="email"
              name="business_email"
              value={config.business_email || ''}
              onChange={handleChange}
              disabled={!edit}
            />
          </div>
          <div className="configuracao-restaurante-pagamentos">
            <h2>Formas de Pagamento</h2>
            <div className="pagamentos-grid">
              <div className="pagamento-item">
                <label className="pagamento-checkbox">
                  <input
                    type="checkbox"
                    checked={paymentMethods.dinheiro}
                    onChange={() => handlePaymentMethodChange('dinheiro')}
                    disabled={!edit}
                  />
                  <FaMoneyBillWave className="payment-icon" />
                  <span>Dinheiro</span>
                </label>
              </div>
              <div className="pagamento-item">
                <label className="pagamento-checkbox">
                  <input
                    type="checkbox"
                    checked={paymentMethods.cartao_debito}
                    onChange={() => handlePaymentMethodChange('cartao_debito')}
                    disabled={!edit}
                  />
                  <MdCreditCard className="payment-icon" />
                  <span>Cartão de Débito</span>
                </label>
              </div>
              <div className="pagamento-item">
                <label className="pagamento-checkbox">
                  <input
                    type="checkbox"
                    checked={paymentMethods.cartao_credito}
                    onChange={() => handlePaymentMethodChange('cartao_credito')}
                    disabled={!edit}
                  />
                  <MdCreditCard className="payment-icon" />
                  <span>Cartão de Crédito</span>
                </label>
              </div>
              <div className="pagamento-item">
                <label className="pagamento-checkbox">
                  <input
                    type="checkbox"
                    checked={paymentMethods.pix}
                    onChange={() => handlePaymentMethodChange('pix')}
                    disabled={!edit}
                  />
                  <MdPix className="payment-icon" />
                  <span>PIX</span>
                </label>
                {paymentMethods.pix && edit && (
                  <div className="pix-key-input">
                    <label>Chave PIX</label>
                    <input
                      type="text"
                      value={paymentMethods.pix_key}
                      onChange={handlePixKeyChange}
                      placeholder="Digite sua chave PIX"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="configuracao-restaurante-horarios">
            <h2>Horários de Funcionamento</h2>
            <div className="horarios-grid">
              {horarios.map((h, idx) => (
                <div key={idx} className="horario-card">
                  <div className="horario-header">
                    <select
                      value={h.day_of_week}
                      onChange={e => handleHorarioChange(idx, 'day_of_week', Number(e.target.value))}
                      disabled={!edit}
                      className="horario-dia"
                    >
                      {diasSemana.map((dia, i) => (
                        <option key={i} value={i}>{dia}</option>
                      ))}
                    </select>
                    {edit && (
                      <button type="button" onClick={() => removeHorario(idx)} className="horario-remover">
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="horario-times">
                    <div className="horario-time-group">
                      <label>Abertura</label>
                      <input
                        type="time"
                        value={h.opening_time}
                        onChange={e => handleHorarioChange(idx, 'opening_time', e.target.value)}
                        disabled={!edit}
                      />
                    </div>
                    <div className="horario-time-group">
                      <label>Fechamento</label>
                      <input
                        type="time"
                        value={h.closing_time}
                        onChange={e => handleHorarioChange(idx, 'closing_time', e.target.value)}
                        disabled={!edit}
                      />
                    </div>
                  </div>
                  <div className="horario-status">
                    <label className="horario-checkbox">
                      <input
                        type="checkbox"
                        checked={h.is_open}
                        onChange={e => handleHorarioChange(idx, 'is_open', e.target.checked)}
                        disabled={!edit}
                      />
                      <span>Aberto</span>
                    </label>
                    <label className="horario-checkbox">
                      <input
                        type="checkbox"
                        checked={h.is_holiday}
                        onChange={e => handleHorarioChange(idx, 'is_holiday', e.target.checked)}
                        disabled={!edit}
                      />
                      <span>Feriado</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {edit && (
              <button type="button" onClick={addHorario} className="horario-adicionar">
                Adicionar Horário
              </button>
            )}
          </div>
          {edit && (
            <div className="configuracao-restaurante-botoes">
              <button type="submit" disabled={loading} className="btn-salvar">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setEdit(false)} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          )}
        </form>
      ) : null}
    </div>
  );
};

export default ConfiguracaoRestaurante;
