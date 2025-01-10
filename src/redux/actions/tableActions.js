import { supabase } from "../../components/SupabaseClient";
import {setLoading,setTables,setError,setUserData,clearError,setStore} from '../features/tableSlice';

export const fetchTableData = (userid) => async (dispatch) => {
    try{
        dispatch(setLoading(true));
        dispatch(clearError());
        const {data:userData,error:userError}=await supabase
        .from('user')
        .select('*')
        .eq('id',userid)
        .single();
        const {data:storeData,error:storeError}=await supabase
        .from('store')
        .select('*')
        .eq('companyid',userData.companyid);
        if(storeError) throw storeError;
        dispatch(setStore(storeData));
        if(userError) throw userError;
        dispatch(setUserData(userData));
        const {data:tableData,error:tableError}=await supabase
        .from('table')
        .select(`
            *,
            store:storeid (
                id,
                name,
                companyid
            ),
            orders (
                id,
                status,
                order_items (
                    id,
                    itemid,
                    quantity,
                    price,
                    total_price,
                    items (
                        id,
                        name,
                        price,
                        category
                    )
                ),
                total_amount,
                created_at
            )`)
        .eq('store.companyid',userData.companyid)
        .order('created_at', { foreignTable: 'orders', ascending: false });
        
        if(tableError) throw tableError;
        dispatch(setTables(tableData));
    }catch(error){
        dispatch(setError(error.message));
        console.error('Error fetching table data:',error);
    }finally{
        dispatch(setLoading(false));
    }
};

export const fetchTableDataByStore = (storeId) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        dispatch(clearError());
        
        const { data: tableData, error: tableError } = await supabase
            .from('table')
            .select(`
                *,
                store:storeid (
                    id,
                    name,
                    companyid
                ),
                orders (
                    id,
                    status,
                    order_items (
                        id,
                        itemid,
                        quantity,
                        price,
                        total_price,
                        items (
                            id,
                            name,
                            price,
                            category
                        )
                    ),
                    total_amount,
                    created_at
                )`)
            .eq('storeid', storeId)
            .order('created_at', { foreignTable: 'orders', ascending: false });
        
        if (tableError) throw tableError;
        dispatch(setTables(tableData));
    } catch (error) {
        dispatch(setError(error.message));
        console.error('Error fetching table data by store:', error);
    } finally {
        dispatch(setLoading(false));
    }
};

export const addTable = (tableData) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        dispatch(clearError());
        
        if (!tableData.store) {
            throw new Error('Store ID is required');
        }

        // Verify store exists
        const { data: storeExists, error: storeError } = await supabase
            .from('store')
            .select('*')
            .eq('id', tableData.store);

        if (storeError || !storeExists || storeExists.length === 0) {
            throw new Error('Invalid store ID or store does not exist');
        }

        let spaceId;
        // Check if space exists
        const { data: existingSpace, error: spaceCheckError } = await supabase
            .from('space')
            .select('*')
            .eq('name', tableData.space)
            .eq('storeid', tableData.store)
            .single();

        if (!existingSpace) {
            // Create new space if it doesn't exist
            const { data: newSpace, error: createSpaceError } = await supabase
                .from('space')
                .insert([{
                    name: tableData.space,
                    storeid: tableData.store
                }])
                .select()
                .single();

            if (createSpaceError) throw createSpaceError;
            spaceId = newSpace.id;
        } else {
            spaceId = existingSpace.id;
        }

        // Insert new table
        const { error: tableError } = await supabase
            .from('table')
            .insert([{
                table_no: tableData.number,
                storeid: tableData.store,
                space: spaceId,
                size: tableData.size,
                label: tableData.label,
                is_occupied: false
            }]);

        if (tableError) throw tableError;

        // Fetch updated tables
        const { data: updatedTables, error: fetchError } = await supabase
            .from('table')
            .select(`
                *,
                store:storeid (
                    id,
                    name,
                    companyid)`)

            .eq('storeid', tableData.store);

        if (fetchError) throw fetchError;
        dispatch(setTables(updatedTables));
    } catch (error) {
        dispatch(setError(error.message));
        console.error('Error adding table:', error);
    } finally {
        dispatch(setLoading(false));
    }
};