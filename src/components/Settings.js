import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/actions/authActions';
import { fetchUserData, addNewStore } from '../redux/actions/settingsAction';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  UserIcon, BuildingOffice2Icon, EnvelopeIcon, BriefcaseIcon, BuildingStorefrontIcon,
  PlusIcon, MapPinIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import SelectedStore from './SelectedStore';

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const { userData, companyData, stores, loading } = useSelector((state) => state.settings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    isActive: false
  });
  const [isStoreSelectModalOpen, setIsStoreSelectModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserData(user.id));
    }
  }, [user?.id, dispatch]);

  const tabs = [
    { 
      id: 'profile', 
      label: 'Profile Settings', 
      icon: <UserIcon className="w-5 h-5" />,
      description: 'View your personal information' 
    },
    { 
      id: 'company', 
      label: 'Company Details', 
      icon: <BuildingOffice2Icon className="w-5 h-5" />,
      description: 'View your company information'
    },
    { 
      id: 'stores', 
      label: 'Store Management', 
      icon: <BuildingStorefrontIcon className="w-5 h-5" />,
      description: 'Manage your store locations' 
    },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
  };
  const [formErrors, setFormErrors] = useState({
    name: '',
    address: ''
  });
  const handleAddStore = async (e) => {
    e.preventDefault(); // Add this to prevent form submission
    if (userData?.companyid) {
      await dispatch(addNewStore(storeForm, userData));
// Close modal after submission.
      setIsModalOpen(false);
      setStoreForm({ // Reset form
        name: '',
        address: '',
        isActive: false
      });
    }
  };

  const handleStoreSelect = (store) => {
    // You can handle the selected store here
    console.log('Selected store:', store);
    // Optionally update user's selected store in your state/redux
  };

  const renderStores = () => {
    if (!stores || stores.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No stores found. Add your first store.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((store) => (
          <div key={store?.id || Math.random()} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{store?.name || 'Unnamed Store'}</h3>
                <div className="flex items-start gap-2 mt-2 text-gray-600">
                  <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{store?.address || 'No address'}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${
                store?.isactive ? 'text-green-600' : 'text-gray-400'
              }`}>
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm">{store?.isactive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage your account preferences and company settings</p>
      </header>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <nav className="lg:w-64 flex-shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                ? 'bg-green-50 text-green-700 shadow-sm' 
                : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                activeTab === tab.id ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {tab.icon}
              </div>
              <div className="ml-3 text-left">
                <p className="font-medium text-sm">{tab.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-500 mt-1">Your personal details</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <UserIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Full Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {userData?.name || 'N/A'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4" /> Email Address
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {userData?.email || 'N/A'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" /> Role
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {userData?.role || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Company Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Your company information</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <BuildingOffice2Icon className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="space-y-8">
                {companyData?.logo && (
                  <div className="flex justify-center">
                    <img
                      src={companyData.logo}
                      alt="Company logo"
                      className="h-32 w-32 object-contain rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                      {companyData?.name || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                      {companyData?.email || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-line">
                      {companyData?.address || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Store Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your store locations</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsStoreSelectModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <BuildingStorefrontIcon className="w-5 h-5" />
                    Select Store
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Store
                  </button>
                </div>
              </div>
              {renderStores()}
            </div>
          )}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Add New Store</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleAddStore} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Store Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={storeForm.name}
                      onChange={(e) => setStoreForm(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      required
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm(prev => ({...prev, address: e.target.value}))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isactive"
                      checked={storeForm.isActive}
                      onChange={e => setStoreForm(prev => ({...prev, isActive: e.target.checked}))}
                      className="h-4 w-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="isactive" className="text-sm text-gray-700">
                      Store is active
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Store
                  </button>
                </form>
              </div>
            </div>
          )}
          <SelectedStore
            isOpen={isStoreSelectModalOpen}
            onClose={() => setIsStoreSelectModalOpen(false)}
            onSelect={handleStoreSelect}
          />
        </div>
      </div>
    </div>
  );
}
