import { createSlice } from "@reduxjs/toolkit";

const initialState={
    loading:false,
    tables:[],
    error:null,
    userData:null,
};
const tableSlice=createSlice({
    name:'order',
    initialState,
    reducers:{
        setOrder:(state,action)=>{
            state.order=(action.payload||[]);
        },
        addOrder:(state,action)=>{
            state.order.push(action.payload);
        },
        setStore:(state,action)=>{
            state.store=(action.payload||[]);
        },
        setDish(state,action){
            
            state.dishes=action.payload;},
        setError:(state,action)=>{
            state.error=action.payload;
        },
        setUserData:(state,action)=>{
            state.userData=action.payload;
        },
        clearError:(state)=>{
            state.error=null;
        },
    },
});
export const {setLoading,setTables,setError,setStore,setUserData,clearError,setDish}=tableSlice.actions;
export default tableSlice.reducer;