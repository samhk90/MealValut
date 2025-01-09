import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../redux/actions/authActions';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  Square2StackIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

const Sidebar = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', {replace: true});
  };
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'Table', icon: Squares2X2Icon, path: '/table' },
    { name: 'Orders', icon: Square2StackIcon, path: '/orders' },
    { name: 'Menu', icon: QueueListIcon, path: '/menu' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className={`p-6 ${isCollapsed ? 'px-4' : ''}`}>
        <h1 className={`font-bold text-white transition-all duration-300 ${isCollapsed ? 'text-xl' : 'text-2xl'}`}>
          {isCollapsed ? 'MV' : 'MealVault'}
        </h1>
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} 
                    px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-green-600 shadow-md hover:bg-opacity-90' 
                      : 'text-white hover:bg-white hover:bg-opacity-10'}`
                  }
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={isCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'} 
                    transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white border-opacity-20">
        <button
          onClick={handleLogout}
          data-tooltip-id="sidebar-tooltip"
          data-tooltip-content={isCollapsed ? 'Logout' : ''}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} 
            px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 
            rounded-lg transition-all duration-200`}
        >
          <ArrowLeftOnRectangleIcon className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Logout'}
        </button>
      </div>
    </>
  );


  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed right-4 top-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Bars3Icon className="h-6 w-6 text-green-600" />
        </button>

        <div className={`md:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className={`md:hidden fixed right-0 inset-y-0 flex flex-col w-64 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 transform transition-transform duration-300 ease-in-out z-50 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white text-xl font-semibold">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent />
        </div>

        <Tooltip id="sidebar-tooltip" place="right" />
      </>
    );
  }

  return (
    <>
      <div 
        className={`h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 
          flex flex-col shadow-xl transition-all duration-300 ease-in-out relative hidden md:flex`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-green-600" />
          )}
        </button>

        <SidebarContent />
      </div>
      <Tooltip id="sidebar-tooltip" place="right" />
    </>
  );
};

export default Sidebar;
