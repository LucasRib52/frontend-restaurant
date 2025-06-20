import React, { useState, useEffect } from 'react';
import produtosRestauranteService from '../../../services/produtosrestaurante';
import categoriaService from '../../../services/categoria';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdClose, 
  MdImage, 
  MdCategory, 
  MdAttachMoney, 
  MdDescription, 
  MdRemoveCircleOutline,
  MdSearch,
  MdFilterList,
  MdSort
} from 'react-icons/md';
import './produtoRestaurante.css';

const ProdutoRestaurante = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('name');
  const [produtoAtual, setProdutoAtual] = useState({
    id: null,
    name: '',
    category: '',
    price: '',
    description: '',
    image: null,
    ingredientGroups: []
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await produtosRestauranteService.getAll();
      setProdutos(Array.isArray(response.data.results) ? response.data.results : []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar produtos');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await categoriaService.getAll();
      setCategorias(Array.isArray(response.data.results) ? response.data.results : []);
    } catch (err) {
      setCategorias([]);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Iniciando submissão do produto:', produtoAtual);
      
      if (!produtoAtual.name || !produtoAtual.category || !produtoAtual.price || !produtoAtual.description) {
        console.log('Campos obrigatórios faltando:', {
          name: produtoAtual.name,
          category: produtoAtual.category,
          price: produtoAtual.price,
          description: produtoAtual.description
        });
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const data = new FormData();
      data.append('name', produtoAtual.name.trim());
      data.append('category_id', produtoAtual.category);
      data.append('price', parseFloat(produtoAtual.price).toFixed(2));
      data.append('description', produtoAtual.description.trim());
      data.append('is_active', true);
      
      console.log('Dados básicos do produto:', {
        name: produtoAtual.name.trim(),
        category_id: produtoAtual.category,
        price: parseFloat(produtoAtual.price).toFixed(2),
        description: produtoAtual.description.trim()
      });
      
      if (produtoAtual.image && produtoAtual.image instanceof File) {
        if (!produtoAtual.image.type || !produtoAtual.image.type.startsWith('image/')) {
          setError('Por favor, selecione um arquivo de imagem válido');
          return;
        }
        if (produtoAtual.image.size > 5 * 1024 * 1024) {
          setError('A imagem deve ter no máximo 5MB');
          return;
        }
        const fileExtension = produtoAtual.image.name.split('.').pop().toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        if (!validExtensions.includes(fileExtension)) {
          setError('Por favor, selecione uma imagem nos formatos: JPG, JPEG, PNG ou GIF');
          return;
        }
        const newFile = new File([produtoAtual.image], `product_image.${fileExtension}`, {
          type: produtoAtual.image.type
        });
        data.append('image', newFile);
        console.log('Imagem anexada:', newFile.name);
      }

      let ingredientIndex = 0;
      const ingredientesEnviados = [];
      produtoAtual.ingredientGroups.forEach(group => {
        if (!group.groupName.trim()) {
          console.log('Grupo sem nome encontrado:', group);
          setError('Por favor, preencha o nome de todos os grupos.');
          return;
        }
        group.ingredients.forEach(ing => {
          if (ing.name.trim()) {
            const ingrediente = {
              name: ing.name.trim(),
              groupName: group.groupName.trim(),
              isRequired: group.isRequired,
              maxQuantity: group.maxQuantity
            };
            ingredientesEnviados.push(ingrediente);
            data.append(`ingredients[${ingredientIndex}]`, JSON.stringify(ingrediente));
            ingredientIndex++;
          }
        });
      });

      console.log('Grupos de ingredientes sendo enviados:', produtoAtual.ingredientGroups);
      console.log('Ingredientes sendo enviados:', ingredientesEnviados);
      console.log('FormData completo:', Object.fromEntries(data.entries()));

      if (error) {
        console.log('Erro encontrado, abortando submissão:', error);
        return;
      }

      console.log('Enviando requisição para o backend...');
      if (produtoAtual.id) {
        console.log('Atualizando produto existente:', produtoAtual.id);
        await produtosRestauranteService.update(produtoAtual.id, data, true);
      } else {
        console.log('Criando novo produto');
        await produtosRestauranteService.create(data, true);
      }
      console.log('Produto salvo com sucesso!');
      setModalOpen(false);
      await fetchProdutos();
      setError(null);
    } catch (err) {
      console.error('Erro detalhado ao salvar produto:', err);
      console.error('Resposta do servidor:', err.response?.data);
      setError(err.response?.data?.message || 'Erro ao salvar produto. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await produtosRestauranteService.delete(id);
      await fetchProdutos();
      setConfirmDelete({ open: false, id: null, name: '' });
    } catch (err) {
      setError('Erro ao excluir produto');
    }
  };

  const openModal = (produto = null) => {
    if (produto) {
      let ingredientGroups = [];
      const ingredientes = produto.available_ingredients || produto.ingredients || [];
      if (ingredientes.length > 0) {
        const groupMap = {};
        ingredientes.forEach((item) => {
          const groupName = (typeof item.group_name === 'string' && item.group_name.trim() !== '') ? item.group_name : '';
          if (!groupMap[groupName]) {
            groupMap[groupName] = {
              groupName,
              isRequired: item.is_required ?? false,
              maxQuantity: item.max_quantity ?? 1,
              ingredients: []
            };
          }
          groupMap[groupName].ingredients.push({
            name: item.ingredient.name,
            id: item.ingredient.id
          });
        });
        ingredientGroups = Object.values(groupMap);
      }
      setProdutoAtual({
        id: produto.id,
        name: produto.name,
        category: produto.category?.id || produto.category_id || '',
        price: produto.price,
        description: produto.description,
        image: produto.image,
        ingredientGroups
      });
    } else {
      setProdutoAtual({
        id: null,
        name: '',
        category: categorias.length > 0 ? categorias[0].id : '',
        price: '',
        description: '',
        image: null,
        ingredientGroups: []
      });
    }
    setModalOpen(true);
  };

  const openDeleteModal = (produto) => {
    setConfirmDelete({ open: true, id: produto.id, name: produto.name });
  };

  const closeDeleteModal = () => {
    setConfirmDelete({ open: false, id: null, name: '' });
  };

  const addGroup = () => {
    // Verifica se já existe um grupo com nome vazio
    const temGrupoVazio = produtoAtual.ingredientGroups.some(group => !group.groupName.trim());
    
    if (temGrupoVazio) {
      setError('Por favor, preencha o nome do grupo atual antes de adicionar um novo.');
      return;
    }

    setProdutoAtual({
      ...produtoAtual,
      ingredientGroups: [
        ...produtoAtual.ingredientGroups,
        { 
          groupName: '', 
          isRequired: false,
          maxQuantity: 1,
          ingredients: [{ name: '' }] 
        }
      ]
    });
  };

  const handleGroupChange = (groupIdx, field, value) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    
    // Se estiver alterando o nome do grupo, verifica se já existe
    if (field === 'groupName') {
      const nomeExistente = newGroups.some((group, idx) => 
        idx !== groupIdx && group.groupName.toLowerCase() === value.toLowerCase()
      );
      
      if (nomeExistente) {
        setError('Já existe um grupo com este nome. Por favor, escolha outro nome.');
        return;
      }
    }
    
    newGroups[groupIdx][field] = value;
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const addIngredient = (groupIdx) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients.push({ name: '' });
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const removeIngredient = (groupIdx, ingIdx) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients = newGroups[groupIdx].ingredients.filter((_, idx) => idx !== ingIdx);
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const handleIngredientChange = (groupIdx, ingIdx, value) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients[ingIdx].name = value;
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem válido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      setProdutoAtual({ ...produtoAtual, image: file });
    }
  };

  const removeGroup = (groupIdx) => {
    setProdutoAtual({
      ...produtoAtual,
      ingredientGroups: produtoAtual.ingredientGroups.filter((_, idx) => idx !== groupIdx)
    });
  };

  const filteredProdutos = produtos
    .filter(produto => {
      const matchesSearch = produto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          produto.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      console.log('Produto:', produto.name);
      console.log('Categoria do produto:', produto.category);
      console.log('Categoria selecionada:', selectedCategory);
      
      const matchesCategory = !selectedCategory || 
                            (produto.category && produto.category.id === parseInt(selectedCategory)) || 
                            produto.category_id === parseInt(selectedCategory);
      
      console.log('Matches category:', matchesCategory);
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOrder === 'price') {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      return 0;
    });

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="produto-container">
      <div className="produto-header">
        <h1>Produtos do Restaurante</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          <MdAdd size={24} />
          Novo Produto
        </button>
      </div>

      <div className="produto-filters">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <MdFilterList size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="sort-box">
          <MdSort size={20} />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="name">Nome</option>
            <option value="price">Preço</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Carregando produtos...</span>
        </div>
      ) : error ? (
        <div className="error">
          <MdClose size={20} />
          <span>{error}</span>
        </div>
      ) : filteredProdutos.length === 0 ? (
        <div className="no-produtos">
          <MdImage size={48} />
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar seus filtros ou adicione um novo produto</p>
        </div>
      ) : (
        <div className="produtos-grid">
          {filteredProdutos.map(produto => (
            <div key={produto.id} className="produto-card">
              <div className="produto-image">
                {produto.image ? (
                  <img src={produto.image} alt={produto.name} />
                ) : (
                  <div className="no-image">
                    <MdImage size={48} />
                    <span>Sem imagem</span>
                  </div>
                )}
              </div>
              
              <h3>{produto.name}</h3>
              
              <p className="produto-category">
                <MdCategory size={20} />
                {produto.category?.name || 'Sem categoria'}
              </p>
              
              <p className="produto-price">
                <MdAttachMoney size={20} />
                {parseFloat(produto.price).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </p>
              
              <p className="produto-description">
                <MdDescription size={20} />
                {produto.description}
              </p>

              {produto.ingredientGroups && produto.ingredientGroups.length > 0 && (
                <div className="grupo-ingredientes-lista">
                  {produto.ingredientGroups.map((group, idx) => (
                    <div key={idx} className="grupo-ingrediente">
                      <strong>{group.groupName}</strong>
                      <ul>
                        {group.ingredients.map((ing, ingIdx) => (
                          <li key={ingIdx}>
                            {ing.name} {ing.maxQuantity > 1 && `(máx: ${ing.maxQuantity})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <div className="produto-actions">
                <button className="btn-edit" onClick={() => openModal(produto)}>
                  <MdEdit size={20} />
                  Editar
                </button>
                <button className="btn-delete" onClick={() => openDeleteModal(produto)}>
                  <MdDelete size={20} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{produtoAtual.id ? 'Editar Produto' : 'Novo Produto'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nome do Produto</label>
                <input
                  type="text"
                  id="name"
                  value={produtoAtual.name}
                  onChange={(e) => setProdutoAtual({...produtoAtual, name: e.target.value})}
                  placeholder="Digite o nome do produto"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoria</label>
                <select
                  id="category"
                  value={produtoAtual.category}
                  onChange={(e) => setProdutoAtual({...produtoAtual, category: e.target.value})}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Preço</label>
                <input
                  type="number"
                  id="price"
                  value={produtoAtual.price}
                  onChange={(e) => setProdutoAtual({...produtoAtual, price: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={produtoAtual.description}
                  onChange={(e) => setProdutoAtual({...produtoAtual, description: e.target.value})}
                  placeholder="Digite a descrição do produto"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Imagem do Produto</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                  />
                  <label htmlFor="image" className="image-label">
                    <MdImage size={24} />
                    <span>{produtoAtual.image ? 'Alterar imagem' : 'Selecionar imagem'}</span>
                  </label>
                </div>
                {produtoAtual.image && (
                  <div className="image-preview">
                    <img src={typeof produtoAtual.image === 'string' ? produtoAtual.image : URL.createObjectURL(produtoAtual.image)} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="ingredient-groups">
                <h3>Grupos de Ingredientes</h3>
                {produtoAtual.ingredientGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="ingredient-group modern-card">
                    <div className="group-header">
                      <input
                        type="text"
                        className="group-name-input"
                        value={group.groupName}
                        onChange={(e) => handleGroupChange(groupIdx, 'groupName', e.target.value)}
                        placeholder="Nome do grupo"
                      />
                      <div className="group-controls">
                        <div className="group-required">
                          <label>
                            <input
                              type="checkbox"
                              checked={group.isRequired}
                              onChange={(e) => handleGroupChange(groupIdx, 'isRequired', e.target.checked)}
                            />
                            Obrigatório
                          </label>
                        </div>
                        <div className="group-quantity">
                          <label>
                            Escolha até:
                            <select
                              value={group.maxQuantity}
                              onChange={(e) => handleGroupChange(groupIdx, 'maxQuantity', parseInt(e.target.value))}
                              className="max-quantity-select"
                            >
                              {[...Array(15)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'item' : 'itens'}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="btn-delete group-remove-btn"
                          onClick={() => removeGroup(groupIdx)}
                          title="Remover grupo"
                        >
                          <MdRemoveCircleOutline size={22} />
                        </button>
                      </div>
                    </div>
                    <div className="ingredients-list">
                      {group.ingredients.map((ing, ingIdx) => (
                        <div key={ingIdx} className="ingredient-item modern-ingredient-item">
                          <input
                            type="text"
                            className="ingredient-name-input"
                            value={ing.name}
                            onChange={(e) => handleIngredientChange(groupIdx, ingIdx, e.target.value)}
                            placeholder="Nome do ingrediente"
                          />
                          <button
                            type="button"
                            className="btn-delete ingredient-remove-btn"
                            onClick={() => removeIngredient(groupIdx, ingIdx)}
                            title="Remover ingrediente"
                          >
                            <MdRemoveCircleOutline size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-add modern-btn-add"
                        onClick={() => addIngredient(groupIdx)}
                      >
                        <MdAdd size={20} /> Adicionar Ingrediente
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary modern-btn-secondary"
                  onClick={addGroup}
                >
                  <MdAdd size={20} />
                  Adicionar Grupo
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {produtoAtual.id ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete.open && (
        <div className="modal-overlay">
          <div className="modal modal-delete">
            <h2>Confirmar Exclusão</h2>
            <p className="delete-message">
              Tem certeza que deseja excluir o produto "{confirmDelete.name}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" onClick={() => handleDelete(confirmDelete.id)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutoRestaurante;

