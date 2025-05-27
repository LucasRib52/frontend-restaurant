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
      // Validate required fields
      if (!produtoAtual.name || !produtoAtual.category || !produtoAtual.price || !produtoAtual.description) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const data = new FormData();
      data.append('name', produtoAtual.name.trim());
      data.append('category_id', produtoAtual.category);
      data.append('price', parseFloat(produtoAtual.price).toFixed(2));
      data.append('description', produtoAtual.description.trim());
      data.append('is_active', true);
      
      // Validar e adicionar a imagem
      if (produtoAtual.image && produtoAtual.image instanceof File) {
        // Verificar se é uma imagem válida
        if (!produtoAtual.image.type || !produtoAtual.image.type.startsWith('image/')) {
          setError('Por favor, selecione um arquivo de imagem válido');
          return;
        }
        // Verificar o tamanho da imagem (máximo 5MB)
        if (produtoAtual.image.size > 5 * 1024 * 1024) {
          setError('A imagem deve ter no máximo 5MB');
          return;
        }
        // Renomear o arquivo para garantir que tenha uma extensão válida
        const fileExtension = produtoAtual.image.name.split('.').pop().toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        if (!validExtensions.includes(fileExtension)) {
          setError('Por favor, selecione uma imagem nos formatos: JPG, JPEG, PNG ou GIF');
          return;
        }
        // Criar um novo arquivo com o nome correto
        const newFile = new File([produtoAtual.image], `product_image.${fileExtension}`, {
          type: produtoAtual.image.type
        });
        data.append('image', newFile);
      }

      let ingredientIndex = 0;
      produtoAtual.ingredientGroups.forEach(group => {
        group.ingredients.forEach(ing => {
          if (ing.name.trim()) {
            data.append(`ingredients[${ingredientIndex}]`, JSON.stringify({
              name: ing.name.trim(),
              category: group.groupName.trim(),
              isRequired: false,
              maxQuantity: parseInt(ing.maxQuantity) || 1
            }));
            ingredientIndex++;
          }
        });
      });

      // Debug: Mostrar o que está sendo enviado
      console.log('Dados sendo enviados:');
      for (let pair of data.entries()) {
        if (pair[0] === 'image') {
          console.log('image:', pair[1].name, pair[1].type, pair[1].size);
        } else {
          console.log(pair[0] + ': ' + pair[1]);
        }
      }

      if (produtoAtual.id) {
        await produtosRestauranteService.update(produtoAtual.id, data, true);
      } else {
        const response = await produtosRestauranteService.create(data, true);
        console.log('Resposta do servidor:', response);
      }
      setModalOpen(false);
      await fetchProdutos();
      setError(null);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      console.error('Detalhes do erro:', err.response?.data);
      if (err.response?.data?.image) {
        setError(err.response.data.image[0]);
      } else {
        setError(err.response?.data?.message || 'Erro ao salvar produto. Verifique os dados e tente novamente.');
      }
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
          const groupName = item.ingredient.category?.name || 'Sem grupo';
          if (!groupMap[groupName]) {
            groupMap[groupName] = [];
          }
          groupMap[groupName].push({
            name: item.ingredient.name,
            maxQuantity: item.max_quantity
          });
        });
        ingredientGroups = Object.entries(groupMap).map(([groupName, ingredients]) => ({
          groupName,
          ingredients
        }));
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

  // Funções para manipular grupos e ingredientes
  const addGroup = () => {
    setProdutoAtual({
      ...produtoAtual,
      ingredientGroups: [
        ...produtoAtual.ingredientGroups,
        { groupName: '', ingredients: [{ name: '', maxQuantity: 1 }] }
      ]
    });
  };

  const removeGroup = (groupIdx) => {
    setProdutoAtual({
      ...produtoAtual,
      ingredientGroups: produtoAtual.ingredientGroups.filter((_, idx) => idx !== groupIdx)
    });
  };

  const handleGroupChange = (groupIdx, value) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].groupName = value;
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const addIngredient = (groupIdx) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients.push({ name: '', maxQuantity: 1 });
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const removeIngredient = (groupIdx, ingIdx) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients = newGroups[groupIdx].ingredients.filter((_, idx) => idx !== ingIdx);
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  const handleIngredientChange = (groupIdx, ingIdx, field, value) => {
    const newGroups = [...produtoAtual.ingredientGroups];
    newGroups[groupIdx].ingredients[ingIdx][field] = value;
    setProdutoAtual({ ...produtoAtual, ingredientGroups: newGroups });
  };

  // Função para lidar com a seleção de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se é uma imagem válida
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem válido');
        return;
      }
      // Verificar o tamanho da imagem (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      setProdutoAtual({ ...produtoAtual, image: file });
    }
  };

  const filteredProdutos = produtos
    .filter(produto => {
      const matchesSearch = produto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          produto.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Debug para verificar os valores
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
                  <div key={groupIdx} className="ingredient-group">
                    <div className="group-header">
                      <input
                        type="text"
                        value={group.groupName}
                        onChange={(e) => handleGroupChange(groupIdx, e.target.value)}
                        placeholder="Nome do grupo"
                      />
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => removeGroup(groupIdx)}
                      >
                        <MdRemoveCircleOutline size={20} />
                      </button>
                    </div>

                    {group.ingredients.map((ing, ingIdx) => (
                      <div key={ingIdx} className="ingredient-item">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => handleIngredientChange(groupIdx, ingIdx, 'name', e.target.value)}
                          placeholder="Nome do ingrediente"
                        />
                        <input
                          type="number"
                          value={ing.maxQuantity}
                          onChange={(e) => handleIngredientChange(groupIdx, ingIdx, 'maxQuantity', e.target.value)}
                          placeholder="Máx"
                          min="1"
                        />
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => removeIngredient(groupIdx, ingIdx)}
                        >
                          <MdRemoveCircleOutline size={20} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => addIngredient(groupIdx)}
                    >
                      <MdAdd size={20} />
                      Adicionar Ingrediente
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-secondary"
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

