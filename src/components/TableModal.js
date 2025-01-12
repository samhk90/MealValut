import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSelector, useDispatch } from 'react-redux';
import { addTable } from '../redux/actions/tableActions';

export default function TableModal({ isOpen, onClose }) {
    const [tableData, setTableData] = useState({
        number: '',
        seats: 2,
        status: 'available',
        space: '',
        store: '',
        size: '',
        label: ''
    });

    const dispatch = useDispatch();
    const { store } = useSelector((state) => state.table);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(addTable(tableData));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Create New Table</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* ... keep only the table creation form ... */}
                </form>
            </div>
        </div>
    );
}
