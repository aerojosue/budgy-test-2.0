import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

export function useHousehold() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['households', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: members, error: membersError } = await supabase
        .from('household_members')
        .select('household_id, role, households(id, name, owner_id, created_at, updated_at)')
        .eq('user_id', user.id)
        .single();

      if (membersError) {
        console.error('Error fetching household:', membersError);
        throw membersError;
      }

      if (!members || !members.households) return null;

      const household = Array.isArray(members.households)
        ? members.households[0]
        : members.households;

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
