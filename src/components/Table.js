import React, { useState, useEffect } from 'react';
import { ClockIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import OrderModal from './OrderModal';
import TableModal from './TableModal';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTableData } from '../redux/actions/tableActions'; 

// Add these utility functions at the top of the file
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Table() {
  const location = useLocation();
  const navigate = useNavigate();
  const {user}=useSelector((state)=>state.auth);
  const {userData,tables,loading,error}=useSelector((state)=>state.table);

  const dispatch=useDispatch();
  useEffect(()=>{
    if(user?.id){
      dispatch(fetchTableData(user.id));
    }
  },[user?.id,dispatch]);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [tableTimers, setTableTimers] = useState({});
  const timerRefs = React.useRef({}); // Add this to store timer references

  useEffect(() => {
    // Clear existing timers
    Object.values(timerRefs.current).forEach(timer => clearInterval(timer));
    timerRefs.current = {};

    // Initialize timers for occupied tables
    tables.forEach(table => {
      if (table.is_occupied) {
        // Get the start time from the latest order for this table
        const startTimer = (tableId) => {
          timerRefs.current[tableId] = setInterval(() => {
            setTableTimers(prev => ({
              ...prev,
              [tableId]: (prev[tableId] || 0) + 1
            }));
          }, 1000);
        };

        startTimer(table.id);
      } else {
        // Reset timer for unoccupied tables
        setTableTimers(prev => ({
          ...prev,
          [table.id]: 0
        }));
      }
    });

    // Cleanup function to clear all timers
    return () => {
      Object.values(timerRefs.current).forEach(timer => clearInterval(timer));
    };
  }, [tables]); // Only re-run when tables change

  const handleTableStatusUpdate = async (tableId, isOccupied) => {
    try {
      // Find and update the table in local state
      const updatedTables = tables.map(table => 
        table.id === tableId 
          ? { ...table, is_occupied: isOccupied }
          : table
      );
      
      // Update the Redux store with new tables data
      dispatch({ 
        type: 'table/updateTableStatus', 
        payload: updatedTables 
      });

      // Handle timer when table status changes
      if (!isOccupied) {
        // Clear timer when table becomes unoccupied
        if (timerRefs.current[tableId]) {
          clearInterval(timerRefs.current[tableId]);
          delete timerRefs.current[tableId];
        }
        setTableTimers(prev => ({
          ...prev,
          [tableId]: 0
        }));
      }
    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  const handleTableClick = (table) => {
    navigate(`/order/${table.id}`);
  };

  // Update getStatusColor to handle is_occupied boolean
  const getStatusColor = (status, isOccupied) => {
    if (isOccupied) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        dot: 'bg-red-500',
        border: 'border-red-200'
      };
    }
    
    const colors = {
      available: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-500',
        border: 'border-green-200'
      },
      reserved: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500',
        border: 'border-yellow-200'
      }
    };
    return colors[status] || colors.available;
  };

  // Add sorting function for tables
  const sortedTables = React.useMemo(() => {
    return [...tables].sort((a, b) => {
        // Convert table_no to numbers for proper numeric sorting
        const aNum = parseInt(a.table_no);
        const bNum = parseInt(b.table_no);
        return aNum - bNum;
    });
  }, [tables]);

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Tables Overview</h1>
         
        </div>
        <div className="flex justify-end m-3 ">
        {location.pathname === '/table' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-150 shadow-sm hover:shadow"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Table</span>
            </button>
          )}
          
        </div>

      </div>
      <div className={location.pathname === '/tables' ? 'bg-white shadow-sm rounded-xl p-5' : ''}>
      <div className="flex justify-end space-x-4 m-3 ">
      <span className="flex items-center text-sm text-gray-600">
            <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
            Available
          </span>
          <span className="flex items-center text-sm text-gray-600">
            <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
            Occupied
          </span>
          <span className="flex items-center text-sm text-gray-600">
            <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
            Reserved
          </span>
      </div>
      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {sortedTables.map((table) => {
          const statusColors = getStatusColor(table.status, table.is_occupied);
          const tableStatus = table.is_occupied ? 'Occupied' : table.status || 'Available';
          
          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)} // Removed condition, always clickable
              className={`relative bg-white rounded-xl shadow-sm border-2 ${statusColors.border} 
                cursor-pointer hover:shadow-lg hover:-translate-y-1
                transition-all duration-300 transform`}
            >
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 ${statusColors.bg} ${statusColors.text} 
                px-3 py-1 rounded-full text-sm font-medium capitalize`}>
                {tableStatus}
              </div>

              <div className="p-6">
                {/* Table Number */}
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-lg ${statusColors.bg} flex items-center 
                    justify-center ${statusColors.text} font-bold text-xl mr-4`}>
                    {table.table_no}
                  </div>
                  <h2 className="text-xl font-semibold">Table {table.table_no}</h2>
                </div>

                {/* Table Details */}
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="h-5 w-5 mr-3" />
                    <span>Seats: {table.size}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-3" />
                    <span>
                      Time: {table.is_occupied ? formatTime(tableTimers[table.id] || 0) : '00:00:00'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className={`px-4 py-2 rounded-lg ${
                    table.status === 'available' 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } transition-colors duration-200`}>
                    Reserve
                  </button>
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200">
                    Details
                  </button>
                </div> */}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      <TableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isCreateMode={true}
        onUpdateStatus={(tableData) => {
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}