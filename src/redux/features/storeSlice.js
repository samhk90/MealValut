import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    stores: [],
    selectedStore: null,
    loading: false,
    error: null
};

const storeSlice = createSlice({
    name: 'store',
    initialState,
    reducers: {
        setStores: (state, action) => {
            state.stores = action.payload;
            state.loading = false;
        },
        setSelectedStore: (state, action) => {
            state.selectedStore = action.payload;
            // Also save to localStorage as backup
            localStorage.setItem('selectedStore', JSON.stringify(action.payload));
        },
        clearSelectedStore: (state) => {
            state.selectedStore = null;
            localStorage.removeItem('selectedStore');
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

export const {
    setStores,
    setSelectedStore,
    clearSelectedStore,
    setLoading,
    setError,
    clearError
} = storeSlice.actions;

export default storeSlice.reducer;
