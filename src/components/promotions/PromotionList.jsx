import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Switch, 
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import promotionService from '@/services/promotionService';
import PromotionForm from '@/components/promotions/PromotionForm';
import { formatCurrency } from '@/utils/formatters';

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promotionService.listPromotions(showInactive);
      console.log('API Response:', data); // Debug log
      
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setPromotions(data);
      } else if (data && Array.isArray(data.results)) {
        // Se a API retornar um objeto com paginação
        setPromotions(data.results);
      } else {
        console.error('Dados inválidos recebidos da API:', data);
        setError('Formato de dados inválido recebido da API');
        setPromotions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
      setError('Erro ao carregar promoções. Por favor, tente novamente.');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [showInactive]);

  const handleToggleActive = async (promotion) => {
    try {
      await promotionService.togglePromotionActive(promotion.id);
      loadPromotions();
    } catch (error) {
      console.error('Erro ao alterar status da promoção:', error);
      // TODO: Adicionar notificação de erro
    }
  };

  const handleEdit = (promotion) => {
    setSelectedPromotion(promotion);
    setIsFormOpen(true);
  };

  const handleDelete = (promotion) => {
    setPromotionToDelete(promotion);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await promotionService.deletePromotion(promotionToDelete.id);
      loadPromotions();
      setIsDeleteDialogOpen(false);
      setPromotionToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir promoção:', error);
      // TODO: Adicionar notificação de erro
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPromotion(null);
  };

  const handleFormSubmit = async (promotionData) => {
    try {
      if (selectedPromotion) {
        await promotionService.updatePromotion(selectedPromotion.id, promotionData);
      } else {
        await promotionService.createPromotion(promotionData);
      }
      loadPromotions();
      handleFormClose();
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      // TODO: Adicionar notificação de erro
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Promoções
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label="Mostrar inativas"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsFormOpen(true)}
          >
            Nova Promoção
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Carregando promoções...</Typography>
        </Box>
      ) : promotions.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Nenhuma promoção encontrada</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {promotions.map((promotion) => (
            <Grid item xs={12} md={6} lg={4} key={promotion.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {promotion.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {promotion.description}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                        {formatCurrency(promotion.price)}
                      </Typography>
                      <Typography color="success.main" sx={{ mt: 1 }}>
                        Economia: {formatCurrency(promotion.savings_amount)}
                      </Typography>
                    </Box>
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={promotion.is_active}
                            onChange={() => handleToggleActive(promotion)}
                          />
                        }
                        label={promotion.is_active ? 'Ativa' : 'Inativa'}
                      />
                      <IconButton onClick={() => handleEdit(promotion)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(promotion)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Produtos da Promoção:
                    </Typography>
                    {promotion.items?.map((item) => (
                      <Typography key={item.id} variant="body2">
                        {item.quantity}x {item.product?.name}
                      </Typography>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Brindes Disponíveis:
                    </Typography>
                    {promotion.rewards?.map((reward) => (
                      <Typography key={reward.id} variant="body2">
                        {reward.product?.name}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={isFormOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPromotion ? 'Editar Promoção' : 'Nova Promoção'}
        </DialogTitle>
        <DialogContent>
          <PromotionForm
            promotion={selectedPromotion}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a promoção "{promotionToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionList; 