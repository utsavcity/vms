const supabase = require('../../config/supabase');

async function getAllFlats() {
  const { data, error } = await supabase
    .from('flats')
    .select('id, flat_number, floor_number, is_occupied, users(id, name, role, is_active)')
    .order('floor_number', { ascending: true });
  if (error) throw error;
  return data;
}

async function getFlatById(flatId) {
  const { data, error } = await supabase
    .from('flats')
    .select('id, flat_number, floor_number, is_occupied, users(id, name, phone, role, is_active)')
    .eq('id', flatId)
    .single();
  if (error) throw error;
  return data;
}

module.exports = { getAllFlats, getFlatById };
