import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ensureUserHasHousehold } from '@/lib/householdHelpers';
import type { Database } from '@/types/database';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

export function useHousehold() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['households', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found');
        return null;
      }

      console.log('Fetching household for user:', user.id);

      const { data: members, error: membersError } = await supabase
        .from('household_members')
        .select('household_id, role, households(id, name, owner_id, created_at, updated_at)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membersError) {
        console.error('Error fetching household:', membersError);
        throw membersError;
      }

      if (!members || !members.households) {
        console.log('No household found, creating one...');

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const userName = profile?.display_name || user.email?.split('@')[0] || 'User';
        const newHousehold = await ensureUserHasHousehold(user.id, userName);

        return {
          ...newHousehold,
          role: 'owner' as const,
        };
      }

      const household = Array.isArray(members.households)
        ? members.households[0]
        : members.households;

      console.log('Found household:', household);

      return {
        ...household,
        role: members.role,
      };
    },
    enabled: !!user,
    retry: 3,
    staleTime: 1000 * 60 * 5,
  });
}
