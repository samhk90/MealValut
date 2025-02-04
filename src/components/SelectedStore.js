import React, { useState, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStores, selectStore } from '../redux/actions/storeActions';

const SelectedStore = ({ isOpen, onClose, onSelect }) => {
    const dispatch = useDispatch();
    const { stores, loading, error } = useSelector(state => state.store);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [currentSelectedStore, setCurrentSelectedStore] = useState(null);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchStores());
            // Get selected store from localStorage when modal opens
            const savedStore = localStorage.getItem('selectedStore');
            if (savedStore) {
                setCurrentSelectedStore(JSON.parse(savedStore));
            }
        }
    }, [dispatch, isOpen]);

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStore = async (store) => {
        setCurrentSelectedStore(store);
        dispatch(selectStore(store));
        onSelect?.(store);
        onClose();
        // Refresh the page after a short delay to ensure store is saved
        setTimeout(() => 
            window.location.reload(), 100);
        
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-green-50">
                    <h2 className="text-xl font-semibold text-gray-800">Select Store</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-green-100 rounded-full transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search stores by name or address..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Store List */}
                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-600">
                            {error}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredStores.map(store => (
                                <button
                                    key={store.id}
                                    onClick={() => handleSelectStore(store)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all
                                        ${(currentSelectedStore?.id === store.id)
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-gray-200 hover:border-green-500 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <BuildingStorefrontIcon className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {store.name}
                                            </h3>
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <MapPinIcon className="h-4 w-4 mr-1" />
                                                {store.address}
                                            </div>
                                            {store.phone && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    📞 {store.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                                transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedStore;
