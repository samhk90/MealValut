import { supabase } from '../../components/SupabaseClient';
import {
  setStores,
  setSelectedStore,
  setLoading,
  setError
} from '../features/storeSlice';

export const fetchStores = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data, error } = await supabase
      .from('store')
      .select('*')
      .order('name');

    if (error) throw error;
    dispatch(setStores(data || []));
  } catch (error) {
    console.error('Error fetching stores:', error);
    dispatch(setError(error.message));
  }
};

export const selectStore = (store) => async (dispatch) => {
  try {
    dispatch(setSelectedStore(store));
    // You can also save the selected store to localStorage or perform other operations
    localStorage.setItem('selectedStore', JSON.stringify(store));
    console.log('Selected store from actions:', store);
  } catch (error) {
    console.error('Error selecting store:', error);
    dispatch(setError(error.message));
  }
};
export const clearSelectedStore = () => async (dispatch) => {
  try {
    dispatch(setSelectedStore(null));
    localStorage.removeItem('selectedStore');
    console.log('Selected store cleared');
  } catch (error) {
    console.error('Error clearing selected store:', error);
    dispatch(setError(error.message));
  }
};