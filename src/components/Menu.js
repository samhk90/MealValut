import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMenuData,addNewdish,updatedDish } from '../redux/actions/menuAction';
import {supabase } from '../components/SupabaseClient';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { categories, userData, items, loading,addDish } = useSelector((state) => state.menu);
  const [stores, setStores] = useState([]);
  const [newDish, setNewDish] = useState({
    name: '',
    category: '', // Changed from 'All' to empty string to match category id format
    price: '',
    description: '',
    storeId: '',
    isactive: true  // Add this line
  });

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchMenuData(user.id));
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    const fetchStores = async () => {
      if (userData?.companyid) {
        const { data, error } = await supabase
          .from('store')
          .select('*')
          .eq('companyid', userData.companyid)
          .eq('isactive', true);

        if (!error && data) {
          setStores(data);
          if (data.length > 0) {
            setNewDish(prev => ({ ...prev, storeId: data[0].id }));
          }
        }
      }
    };

    fetchStores();
  }, [userData?.companyid]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addNewdish(newDish));
      setNewDish({
        name: '',
        category: 'All',
        price: '',
        description: '',
        storeId: stores[0]?.id || '',
        isactive: true
      });
      fetchMenuData(user.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding dish:', error);
      alert(`Failed to add dish: ${error.message}`);
    }
  };

  const handleEditClick = (dish) => {
    setEditingDish({
      ...dish,
      category: dish.categoryid || dish.category,
      storeId: dish.storeid || dish.store?.id
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updatedDish(editingDish));
      setIsEditModalOpen(false);
      setEditingDish(null);
      dispatch(fetchMenuData(user.id));
    } catch (error) {
      console.error('Error updating dish:', error);
      alert(`Failed to update dish: ${error.message}`);
    }
  };

  // Update the filtered items logic
  const filteredItems = activeCategory === 'All'
    ? (items || [])
    : (items || []).filter(item => {
        console.log('Checking item:', item);
        // Check both category and categoryid fields
        return item.category === activeCategory || 
               item.categoryid === activeCategory;
      });


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="flex overflow-x-auto pb-4 gap-4 mb-6">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200
            ${activeCategory === 'All'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {(categories || []).map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200
              ${activeCategory === category.id
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            onClick={() => handleEditClick(item)}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            
            <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
            <p className="text-gray-600 mt-2">{item.description}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-bold text-green-600">${item.price}</span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BuildingStorefrontIcon className="h-4 w-4" />
                <span>{item.store?.name || 'No store assigned'}</span>
              </div>
            </div>

            
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-6 bottom-6 bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-colors"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Dish</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            

              <input
                type="text"
                placeholder="Dish Name"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={newDish.name}
                onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                required
              />
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Store
                </label>
                <select
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newDish.storeId}
                  onChange={e => setNewDish({ ...newDish, storeId: e.target.value })}
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={newDish.category}
                onChange={e => setNewDish({ ...newDish, category: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {(categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Price"
                step="0.01"
                className="w-full p-2 border rounded-lg"
                value={newDish.price}
                onChange={e => setNewDish({ ...newDish, price: e.target.value })}
              />

              <textarea
                placeholder="Description"
                className="w-full p-2 border rounded-lg"
                value={newDish.description}
                onChange={e => setNewDish({ ...newDish, description: e.target.value })}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isactive"
                  checked={newDish.isactive}
                  onChange={e => setNewDish({ ...newDish, isactive: e.target.checked })}
                  className="h-4 w-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="isactive" className="text-sm text-gray-700">
                  Item is active
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Add Dish
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Dish</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Dish Name"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={editingDish.name}
                onChange={e => setEditingDish({ ...editingDish, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Store
                </label>
                <select
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={editingDish.storeId}
                  onChange={e => setEditingDish({ ...editingDish, storeId: e.target.value })}
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={editingDish.category}
                onChange={e => setEditingDish({ ...editingDish, category: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {(categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Price"
                step="0.01"
                className="w-full p-2 border rounded-lg"
                value={editingDish.price}
                onChange={e => setEditingDish({ ...editingDish, price: e.target.value })}
                required
              />

              <textarea
                placeholder="Description"
                className="w-full p-2 border rounded-lg"
                value={editingDish.description}
                onChange={e => setEditingDish({ ...editingDish, description: e.target.value })}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isactive"
                  checked={editingDish.isactive}
                  onChange={e => setEditingDish({ ...editingDish, isactive: e.target.checked })}
                  className="h-4 w-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="edit-isactive" className="text-sm text-gray-700">
                  Item is active
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Update Dish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;