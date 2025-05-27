import React from 'react';
import { FaBell } from 'react-icons/fa';
import './headerAdmin.css';

const HeaderAdmin = () => {
  return (
    <header className="header-admin">
      <div className="header-left">
        <h1>Bem-vindo, Restaurante</h1>
      </div>
      
      <div className="header-right">
        <div className="notifications" title="Notificações">
          <FaBell className="icon" />
          <span className="badge">3</span>
        </div>
        
        <div className="profile" title="Perfil">
          <img 
            src="https://via.placeholder.com/45" 
            alt="Perfil" 
            className="profile-image"
          />
          <div className="profile-info">
            <span className="name">Restaurante</span>
            <span className="role">Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;
