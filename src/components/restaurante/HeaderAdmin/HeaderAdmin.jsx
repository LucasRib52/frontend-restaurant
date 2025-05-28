import { useState, useRef, useEffect } from 'react';
import authService from '../../../services/authService';
import './headerAdmin.css';

const HeaderAdmin = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = authService.getUser();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="header-admin">
      <h1 className="header-admin-title">Restaurante</h1>
      
      <div className="header-admin-user" ref={dropdownRef}>
        <button 
          className="header-admin-user-button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {user?.username || 'Usuário'}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        <div className={`header-admin-dropdown ${isDropdownOpen ? 'show' : ''}`}>
          <div className="header-admin-dropdown-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {user?.username || 'Usuário'}
          </div>
          
          <div className="header-admin-dropdown-divider" />
          
          <button 
            className="header-admin-dropdown-item logout"
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;
