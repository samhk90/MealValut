import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  categories: [],
  error: null,
  userData: null,
  items: []  // Ensure items is initialized as empty array
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = (action.payload || []); // Assuming category objects have a name property
    },
    setMenu: (state, action) => {
      state.items = action.payload || [];  // Fix the items setter
    },
    addDish: (state, action) => {
      state.items.push(action.payload);
    },
    updateDish: (state, action) => {
      const dishIndex = state.items.findIndex(dish => dish.id === action.payload.id);
      if (dishIndex > -1) {
        state.items[dishIndex] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setLoading,
  setCategories,
  setError,
  setUserData,
  clearError,
  setMenu,
  addDish,
  updateDish
} = menuSlice.actions;

export default menuSlice.reducer;