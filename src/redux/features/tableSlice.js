import { createSlice } from "@reduxjs/toolkit";
const initialState={
    loading:false,
    tables:[],
    error:null,
    userData:null,
};
const tableSlice=createSlice({
    name:'table',
    initialState,
    reducers:{
        setLoading:(state,action)=>{
            state.loading=action.payload;
        },
        setTables:(state,action)=>{
            state.tables=(action.payload||[]);
        },
        addTable:(state,action)=>{
            state.tables.push(action.payload);
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