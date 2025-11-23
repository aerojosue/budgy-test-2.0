import { supabase } from './supabase';

export async function ensureUserHasHousehold(userId: string, userName: string) {
  console.log('Checking household for user:', userId);

  const { data: existingMember, error: memberError } = await supabase
    .from('household_members')
    .select('household_id, households(id, name, owner_id)')
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) {
    console.error('Error checking household membership:', memberError);
    throw memberError;
  }

  if (existingMember && existingMember.households) {
    console.log('User already has household:', existingMember.households);
    return existingMember.households;
  }

  console.log('No household found. Creating personal household...');

  const householdName = `${userName}'s Household`;

  const { data: newHousehold, error: householdError } = await supabase
    .from('households')
    .insert({
      name: householdName,
      owner_id: userId,
    })
    .select()
    .single();

  if (householdError) {
    console.error('Error creating household:', householdError);
    throw householdError;
  }

  console.log('Created household:', newHousehold);

  const { error: membershipError } = await supabase
    .from('household_members')
    .insert({
      household_id: newHousehold.id,
      user_id: userId,
      role: 'owner',
    });

  if (membershipError) {
    console.error('Error creating household membership:', membershipError);
    throw membershipError;
  }

  console.log('User added to household as owner');

  return newHousehold;
}
