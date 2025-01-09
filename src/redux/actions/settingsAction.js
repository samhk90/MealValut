import { supabase } from "../../components/SupabaseClient";
import {   setloading, setUserData, setCompanyData, setStores, addStores, setError,clearError, } from "../features/settingSlice";

export const fetchUserData = (userId) => async (dispatch) => {
    try{
        dispatch(setloading(true));
        dispatch(clearError());
        //fetch user data
        const {data:userData, error:userError} = await supabase
        .from('user')
        .select('*')
        .eq('id',userId)
        .single();
        //Error handling for user data
        if (userError) throw userError;
        dispatch(setUserData(userData));
        const {data:companyData,error:companyError} = await supabase
        .from('company')
        .select('*')
        .eq('id',userData.companyid)
        .single();
        //Error handling for company data
        if(companyError) throw companyError;
        dispatch(setCompanyData(companyData));
        //fetch store data
        const {data:storeData,error:storeError} = await supabase
        .from('store')
        .select('*')
        .eq('companyid',userData.companyid);
        if(storeError) throw storeError;
        dispatch(setStores(storeData));
        }catch(error){
            dispatch(setError(true));
            alert('Error fetching setting data',error.message)
        }finally{
            dispatch(setloading(false));
        };
    };
export const addNewStore = (storeData,userData) => async (dispatch) => {
    try{
        dispatch(setloading(true));
        dispatch(clearError());
      const { data, error } = await supabase
        .from('store')
        .insert({
          name: storeData.name,
          address: storeData.address,
          isactive: storeData.isActive,
          companyid: userData?.companyid
        })
        .select('*') // Make sure to select all fields after insert
        .single();
        if (error) throw error;
        dispatch(addStores(data));
    }catch(error){
        dispatch(setError(error));
        alert('Error adding store data',error.message);}
    finally{
        dispatch(setloading(false));
    }
};

