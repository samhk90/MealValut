import { supabase } from '../../components/SupabaseClient';
import { setLoading, setUser, setError, clearUser, clearError } from '../features/authSlice';

export const loginUser = (email, password) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    dispatch(setUser(data.user));
  } catch (error) {
    alert('Error',error.message);
    dispatch(setError(error.message));
  }
};

export const signUp = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    
    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Create company record
    const { data: companyData, error: companyError } = await supabase
      .from('company')  // Make sure table name matches your Supabase table
      .insert({
        name: formData.companyName,
        address: formData.companyAddress,
        email: formData.companyEmail,
        logo: formData.logo || null
      })
      .select()
      .single();

    if (companyError) throw companyError;
    if (!companyData) throw new Error('Company creation failed');

    // 3. Create user profile
    const { data: userData, error: userError } = await supabase
      .from('user')  // Make sure table name matches your Supabase table
      .insert({
        auth_id: authData.user.id,
        company_id: companyData.id, // Use companyData.id instead of companyid
        username: formData.userName,
        email: formData.email,
        role: 'admin'
      })
      .select()
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('User profile creation failed');

    // 4. Set user data in Redux store
    dispatch(setUser({
      ...authData.user,
      profile: userData,
      company: companyData
    }));

    return { success: true };

  } catch (error) {
    console.error('Signup error:', error);
    dispatch(setError(error.message));
    return { success: false, error: error.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    dispatch(clearUser());
  } catch (error) {
    dispatch(setError(error.message));
  }
};


