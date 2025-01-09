import { supabase } from '../../components/SupabaseClient';
import { setLoading, setUserData, setCategories, setError, clearError, setMenu, addDish,updateDish } from '../features/menuSlice';

export const fetchMenuData = (userId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());

    // Get user's company ID
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('companyid')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    dispatch(setUserData(userData));

    // Get menu items - Fixed the query
    const { data: menuItems, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        store:storeid (
          id,
          name,
          companyid
        )
      `)
      .eq('store.companyid', userData.companyid);

    if (itemError) throw itemError;
    dispatch(setMenu(menuItems));

    // Get categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('category')
      .select('*')
      .eq('companyid', userData.companyid)
      .order('name');
    if (categoryError) throw categoryError;
    dispatch(setCategories(categoryData));

  } catch (error) {
    dispatch(setError(error.message));
    console.error('Error fetching menu data:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export const addNewdish = (newDish) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());

    const { data, error } = await supabase
      .from('items')
      .insert([{
        name: newDish.name,
        category: newDish.category,
        price: parseFloat(newDish.price),
        item_image: 'null',
        is_active:newDish.isactive,
        description: newDish.description,
        storeid: newDish.storeId
      }])
      .select('*')
      .single();

    if (error) throw error;
    
    dispatch(addDish(data));
    return { success: true };

  } catch (error) {
    dispatch(setError(error.message));
    console.error('Error adding dish:', error.message);
    throw new Error(error.message);
  } finally {
    dispatch(setLoading(false));
  }
};
export const updatedDish = (updatedDish) => async (dispatch) => {
  try{
    dispatch(setLoading(true));
    dispatch(clearError());
    const {data,error} = await supabase
    .from('items')
    .update({
      name: updatedDish.name,
      category: updatedDish.category,
      price: parseFloat(updatedDish.price),
      item_image: 'null',})
    .eq('id',updatedDish.id)
    
    if(error) throw error;
    dispatch(updateDish(data));
  }catch(error){
    dispatch(setError(error.message));
    console.error('Error updating dish:',error.message);
  }finally{
    dispatch(setLoading(false));
  }
};