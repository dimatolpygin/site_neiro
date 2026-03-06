import { createServiceClient } from '@/lib/supabase/server';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Profile } from '@/types/database';

export default async function AdminUsersPage() {
  const admin = createServiceClient();

  const { data } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const users = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground">Все зарегистрированные пользователи</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Имя</th>
              <th className="text-left p-3 font-medium">Баланс</th>
              <th className="text-left p-3 font-medium">Роль</th>
              <th className="text-left p-3 font-medium">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.full_name ?? '—'}</td>
                <td className="p-3 font-medium">{kopecksToRubles(user.balance)}</td>
                <td className="p-3">
                  {user.is_admin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ru })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
