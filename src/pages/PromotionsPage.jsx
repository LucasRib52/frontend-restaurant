import React from 'react';
import { Container } from '@mui/material';
import PromotionList from '../components/promotions/PromotionList';

const PromotionsPage = () => {
  return (
    <Container maxWidth="xl">
      <PromotionList />
    </Container>
  );
};

export default PromotionsPage; 