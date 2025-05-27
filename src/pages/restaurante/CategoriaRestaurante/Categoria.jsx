import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { MdEdit, MdDelete } from 'react-icons/md';
import { IoMdAdd } from 'react-icons/io';
import categoriaService from '../../../services/categoria';
import './categoria.css';

const Categoria = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState({
    id: null,
    name: ''
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await categoriaService.getAll();
      console.log('Resposta da API:', response.data); // Debug
      setCategorias(Array.isArray(response.data.results) ? response.data.results : []);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setError('Erro ao carregar categorias');
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoriaAtual.id) {
        await categoriaService.update(categoriaAtual.id, { name: categoriaAtual.name });
      } else {
        const response = await categoriaService.create({ name: categoriaAtual.name });
        console.log('Categoria criada:', response.data); // Debug
      }
      setModalOpen(false);
      await fetchCategorias(); // Força atualização da lista
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      setError('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await categoriaService.delete(id);
        await fetchCategorias(); // Força atualização da lista
        setConfirmDelete({ open: false, id: null, name: '' });
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        setError('Erro ao excluir categoria');
      }
    }
  };

  const openModal = (categoria = null) => {
    if (categoria) {
      setCategoriaAtual(categoria);
    } else {
      setCategoriaAtual({
        id: null,
        name: ''
      });
    }
    setModalOpen(true);
  };

  const openDeleteModal = (categoria) => {
    setConfirmDelete({ open: true, id: categoria.id, name: categoria.name });
  };

  const closeDeleteModal = () => {
    setConfirmDelete({ open: false, id: null, name: '' });
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="categoria-container">
      <div className="categoria-header">
        <h1>Categorias</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          <IoMdAdd size={24} /> Nova Categoria
        </button>
      </div>

      <div className="categorias-grid">
        {Array.isArray(categorias) && categorias.length > 0 ? (
          categorias.map((categoria) => (
            <div key={categoria.id} className="categoria-card">
              <div className="categoria-info">
                <h3>{categoria.name}</h3>
              </div>
              <div className="categoria-actions">
                <button
                  className="btn-edit"
                  onClick={() => openModal(categoria)}
                  title="Editar categoria"
                >
                  <MdEdit size={22} />
                </button>
                <button
                  className="btn-delete"
                  onClick={() => openDeleteModal(categoria)}
                  title="Excluir categoria"
                >
                  <MdDelete size={22} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-categories">
            <div className="no-categories-icon">
              <IoMdAdd size={48} />
            </div>
            <p>Nenhuma categoria encontrada</p>
            <button className="btn-primary" onClick={() => openModal()}>
              <IoMdAdd size={20} /> Criar primeira categoria
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{categoriaAtual.id ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nome da Categoria</label>
                <input
                  type="text"
                  id="name"
                  value={categoriaAtual.name}
                  onChange={(e) =>
                    setCategoriaAtual({ ...categoriaAtual, name: e.target.value })
                  }
                  placeholder="Digite o nome da categoria"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {categoriaAtual.id ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete.open && (
        <div className="modal-overlay">
          <div className="modal modal-delete">
            <h2>Excluir Categoria</h2>
            <p className="delete-message">Deseja realmente excluir a categoria <b>{confirmDelete.name}</b>?<br/>Esta ação não poderá ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal}>Cancelar</button>
              <button className="btn-save btn-delete-confirm" onClick={() => handleDelete(confirmDelete.id)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categoria;
