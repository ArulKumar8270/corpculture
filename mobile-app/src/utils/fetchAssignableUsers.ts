import axios from 'axios';
import { getApiBaseUrl } from '../services/api';

/** Users linked to any employee (all types). Matches web Rental/Service invoice assign lists. */
export async function fetchAssignableUsers(token: string): Promise<any[]> {
  const base = getApiBaseUrl();
  if (!base || !token) return [];

  const employeeRes = await axios.get(`${base}/employee/all`, {
    headers: { Authorization: token },
  });

  if (!employeeRes.data?.success) return [];

  const employees = employeeRes.data.employees || [];
  const userIdSet = new Set(
    employees
      .map((emp: any) => emp?.userId)
      .filter(Boolean)
      .map((id: any) => String(id))
  );

  if (userIdSet.size === 0) return [];

  const userRes = await axios.get(`${base}/auth/all-users`, {
    headers: { Authorization: token },
  });

  const allUsers = userRes.data?.users || [];
  return allUsers
    .filter((u: any) => userIdSet.has(String(u._id)))
    .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
}
