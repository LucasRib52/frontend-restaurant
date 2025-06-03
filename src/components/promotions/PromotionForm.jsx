import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Paper,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CloudUpload as CloudUploadIcon,
  LocalOffer as LocalOfferIcon,
  CardGiftcard as GiftIcon,
  PhotoCamera as PhotoIcon
} from '@mui/icons-material';
import productService from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';

// Estilos constantes
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  paper: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '18px',
    padding: '32px 24px',
    boxShadow: '0 4px 24px rgba(52,99,255,0.09)',
    border: '1.5px solid #eaf6ff',
    backdropFilter: 'blur(8px)',
  },
  title: {
    color: '#3498db',
    fontWeight: 800,
    marginBottom: '24px',
    textAlign: 'center',
    letterSpacing: '-0.5px',
  },
  errorAlert: {
    mb: 3,
    borderRadius: '12px',
    '& .MuiAlert-icon': {
      color: '#e74c3c'
    }
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    mb: 2
  },
  imageCard: {
    width: '100%',
    maxWidth: '300px',
    height: '200px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(52,99,255,0.09)',
    border: '1.5px solid #eaf6ff',
    background: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadButton: {
    borderRadius: '12px',
    textTransform: 'none',
    padding: '8px 24px',
    borderColor: '#3498db',
    color: '#3498db',
    '&:hover': {
      borderColor: '#2980b9',
      backgroundColor: 'rgba(52,152,219,0.04)'
    }
  },
  inputField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '&:hover fieldset': {
        borderColor: '#3498db',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3498db',
      }
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3498db'
    }
  },
  selectField: {
    borderRadius: '12px',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3498db',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3498db',
    }
  },
  sectionDivider: {
    my: 2,
    '& .MuiDivider-wrapper': {
      color: '#3498db',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }
  },
  itemCard: {
    p: 2,
    mb: 2,
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #eaf6ff',
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    flexWrap: { xs: 'wrap', sm: 'nowrap' }
  },
  removeButton: {
    color: '#e74c3c',
    '&:hover': {
      backgroundColor: 'rgba(231,76,60,0.08)'
    }
  },
  addButton: {
    mt: 1,
    mb: 3,
    borderRadius: '12px',
    textTransform: 'none',
    background: '#3498db',
    color: '#fff',
    '&:hover': {
      background: '#2980b9'
    }
  },
  actionButtons: {
    display: 'flex',
    gap: 2,
    justifyContent: 'flex-end',
    mt: 2
  },
  cancelButton: {
    borderRadius: '12px',
    textTransform: 'none',
    padding: '10px 24px',
    borderColor: '#3498db',
    color: '#3498db',
    '&:hover': {
      borderColor: '#2980b9',
      backgroundColor: 'rgba(52,152,219,0.04)'
    }
  },
  submitButton: {
    borderRadius: '12px',
    textTransform: 'none',
    padding: '10px 32px',
    background: '#3498db',
    color: '#fff',
    '&:hover': {
      background: '#2980b9'
    },
    '&.Mui-disabled': {
      background: '#bdc3c7',
      color: '#fff'
    }
  }
};

// Componente de Upload de Imagem
const ImageUpload = ({ imagePreview, onImageChange }) => (
  <Box sx={styles.imageContainer}>
    <Card sx={styles.imageCard}>
      {imagePreview ? (
        <CardMedia
          component="img"
          image={imagePreview}
          alt="Preview da promoção"
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <PhotoIcon sx={{ fontSize: 48, color: '#3498db', opacity: 0.5 }} />
      )}
    </Card>
    
    <Button
      component="label"
      variant="outlined"
      startIcon={<CloudUploadIcon />}
      sx={styles.uploadButton}
    >
      Escolher Imagem
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={onImageChange}
      />
    </Button>
  </Box>
);

// Componente de Item da Promoção
const PromotionItem = ({ item, index, products, onItemChange, onRemove }) => (
  <Paper sx={styles.itemCard}>
    <Autocomplete
      value={item.product || null}
      onChange={(e, value) => onItemChange(index, 'product')(e, value)}
      options={products}
      getOptionLabel={(option) => option?.name || ''}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Produto"
          required
          sx={{ ...styles.inputField, flex: 1 }}
        />
      )}
    />
    
    <TextField
      type="number"
      label="Quantidade"
      value={item.quantity}
      onChange={(e) => onItemChange(index, 'quantity')(e, e.target.value)}
      required
      sx={{ ...styles.inputField, width: { xs: '100%', sm: '120px' } }}
    />

    <Tooltip title="Remover produto">
      <IconButton onClick={() => onRemove(index)} sx={styles.removeButton}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  </Paper>
);

// Componente de Brinde
const PromotionReward = ({ reward, index, products, onRewardChange, onRemove }) => (
  <Paper sx={styles.itemCard}>
    <Autocomplete
      value={reward.product || null}
      onChange={(e, value) => onRewardChange(index)(e, value)}
      options={products}
      getOptionLabel={(option) => option?.name || ''}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Brinde"
          required
          fullWidth
          sx={styles.inputField}
        />
      )}
    />

    <Tooltip title="Remover brinde">
      <IconButton onClick={() => onRemove(index)} sx={styles.removeButton}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  </Paper>
);

const PromotionForm = ({ promotion, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true,
    items: [],
    rewards: [],
    image: null,
    imagePreview: null
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadProducts();
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description,
        price: promotion.price,
        is_active: promotion.is_active,
        items: promotion.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          product: item.product
        })),
        rewards: promotion.rewards.map(reward => ({
          product_id: reward.product.id,
          product: reward.product
        })),
        image: promotion.image || null,
        imagePreview: promotion.image || null
      });
    }
  }, [promotion]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setError(null);
      const data = await productService.listProducts();
      console.log('Produtos carregados:', data); // Debug log

      // Garantir que data é um array
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && Array.isArray(data.results)) {
        // Se a API retornar um objeto com paginação
        setProducts(data.results);
      } else {
        console.error('Dados inválidos recebidos da API:', data);
        setError('Formato de dados inválido recebido da API');
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos. Por favor, tente novamente.');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field) => (event, value) => {
    const newItems = [...formData.items];
    if (field === 'product') {
      if (!value) {
        // Se nenhum produto foi selecionado
        newItems[index] = {
          ...newItems[index],
          product_id: '',
          product: null
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          product_id: value.id,
          product: value
        };
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
    }
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const handleAddReward = () => {
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, { product_id: '' }]
    }));
  };

  const handleRemoveReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const handleRewardChange = (index) => (event, value) => {
    const newRewards = [...formData.rewards];
    if (!value) {
      // Se nenhum produto foi selecionado
      newRewards[index] = {
        product_id: '',
        product: null
      };
    } else {
      newRewards[index] = {
        product_id: value.id,
        product: value
      };
    }
    setFormData(prev => ({
      ...prev,
      rewards: newRewards
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Validar formulário
    if (!formData.name || !formData.description || !formData.price) {
      setError('Por favor, preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    if (formData.items.length === 0) {
      setError('Adicione pelo menos um produto à promoção');
      setLoading(false);
      return;
    }

    if (formData.rewards.length === 0) {
      setError('Adicione pelo menos um brinde à promoção');
      setLoading(false);
      return;
    }

    // Validar se todos os itens têm produto selecionado
    const hasInvalidItems = formData.items.some(item => !item.product_id);
    if (hasInvalidItems) {
      setError('Todos os produtos devem ser selecionados');
      setLoading(false);
      return;
    }

    // Validar se todos os brindes têm produto selecionado
    const hasInvalidRewards = formData.rewards.some(reward => !reward.product_id);
    if (hasInvalidRewards) {
      setError('Todos os brindes devem ser selecionados');
      setLoading(false);
      return;
    }

    // Preparar dados para envio
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('price', parseFloat(formData.price));
    submitData.append('is_active', formData.is_active);
    submitData.append('items', JSON.stringify(formData.items.map(item => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity)
    }))));
    submitData.append('rewards', JSON.stringify(formData.rewards.map(reward => ({
      product_id: reward.product_id
    }))));
    
    if (formData.image) {
      submitData.append('image', formData.image);
    }

    onSubmit(submitData);
    setLoading(false);
  };

  if (loadingProducts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={styles.container}>
      <Paper elevation={0} sx={styles.paper}>
        <Typography variant="h5" component="h2" sx={styles.title}>
          {promotion ? 'Editar Promoção' : 'Nova Promoção'}
        </Typography>

        {error && (
          <Alert severity="error" sx={styles.errorAlert}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Upload de Imagem */}
          <Grid item xs={12}>
            <ImageUpload 
              imagePreview={formData.imagePreview} 
              onImageChange={handleImageChange} 
            />
          </Grid>

          {/* Informações Básicas */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome da Promoção"
              value={formData.name}
              onChange={handleChange('name')}
              required
              sx={styles.inputField}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Preço"
              type="number"
              value={formData.price}
              onChange={handleChange('price')}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={styles.inputField}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={handleChange('description')}
              required
              multiline
              rows={3}
              sx={styles.inputField}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active}
                onChange={handleChange('is_active')}
                label="Status"
                sx={styles.selectField}
              >
                <MenuItem value={true}>Ativa</MenuItem>
                <MenuItem value={false}>Inativa</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Produtos da Promoção */}
          <Grid item xs={12}>
            <Divider sx={styles.sectionDivider}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalOfferIcon /> Produtos da Promoção
              </Typography>
            </Divider>

            {formData.items.map((item, index) => (
              <PromotionItem
                key={index}
                item={item}
                index={index}
                products={products}
                onItemChange={handleItemChange}
                onRemove={handleRemoveItem}
              />
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={styles.addButton}
            >
              Adicionar Produto
            </Button>

            {/* Brindes */}
            <Divider sx={styles.sectionDivider}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GiftIcon /> Brindes
              </Typography>
            </Divider>

            {formData.rewards.map((reward, index) => (
              <PromotionReward
                key={index}
                reward={reward}
                index={index}
                products={products}
                onRewardChange={handleRewardChange}
                onRemove={handleRemoveReward}
              />
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddReward}
              sx={styles.addButton}
            >
              Adicionar Brinde
            </Button>
          </Grid>

          {/* Botões de Ação */}
          <Grid item xs={12}>
            <Box sx={styles.actionButtons}>
              <Button
                onClick={onCancel}
                sx={styles.cancelButton}
                variant="outlined"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                sx={styles.submitButton}
                variant="contained"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  promotion ? 'Salvar Alterações' : 'Criar Promoção'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PromotionForm; 