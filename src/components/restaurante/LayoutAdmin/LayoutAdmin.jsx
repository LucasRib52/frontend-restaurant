import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../SidebarAdmin/SidebarAdmin';
import HeaderAdmin from '../HeaderAdmin/HeaderAdmin';
import './layoutAdmin.css';

const LayoutAdmin = () => {
  return (
    <div className="layout-admin">
      <SidebarAdmin />
      <HeaderAdmin />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutAdmin; 