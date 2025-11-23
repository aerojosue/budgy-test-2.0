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
        .select('*, households(*)')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      const households = members?.map((member: HouseholdMember & { households: Household }) => ({
        ...member.households,
        role: member.role,
      })) || [];

      return households.length > 0 ? households[0] : null;
    },
    enabled: !!user,
  });
}
