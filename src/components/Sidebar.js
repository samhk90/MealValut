import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../redux/actions/authActions';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Square2StackIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, path: '/' },
  { name: 'Table', icon: Squares2X2Icon, path: '/table' },
  { name: 'Takeaway', icon: ShoppingBagIcon, path: '/takeaway' },
  { name: 'Orders', icon: Square2StackIcon, path: '/orders' },
  { name: 'Menu', icon: QueueListIcon, path: '/menu' },
  { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' }
];

const SidebarContent = ({ handleLogout }) => (
  <>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">MealVault</h1>
    </div>

    <nav className="flex-1 px-2">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center justify-start 
                px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-white text-green-600 shadow-md hover:bg-opacity-90' 
                  : 'text-white hover:bg-white hover:bg-opacity-10'}`
              }
            >
              <item.icon className="h-6 w-6 mr-3" />
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>

    <div className="p-4 border-t border-white border-opacity-20">
      <button
        onClick={handleLogout}
        className="w-full flex items-center px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 
          rounded-lg transition-all duration-200"
      >
        <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
        Logout
      </button>
    </div>
  </>
);

const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', {replace: true});
  };

  return (
    <>
      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-green-400 
        via-emerald-500 to-teal-600 transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white hover:text-gray-200"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <SidebarContent handleLogout={handleLogout} />
      </div>

      <Tooltip id="sidebar-tooltip" place="right" />
    </>
  );
};

export default Sidebar;
