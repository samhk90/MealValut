import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    userData: null,
    companyData: null,
    stores: [],
    loading: false,
    error: null
};
const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers:{
        setloading(state, action){state.loading = action.payload;},
        setUserData(state, action){state.userData = action.payload;},
        setCompanyData(state, action){state.companyData = action.payload;},
        setStores(state, action){state.stores = action.payload;},
        addStores(state, action){
            if (Array.isArray(state.stores)) {
                state.stores.push(action.payload);
            } else {
                state.stores = [action.payload];
            }
        },
        setError(state, action){state.error = action.payload;},
        clearError(state){state.error = null;}


    }
});

export const {
    setloading,
    setUserData,
    setCompanyData,
    setStores,
    addStores,  // Changed from addStore to addStores
    setError,
    clearError,
  } = settingSlice.actions;
  
  export default settingSlice.reducer;