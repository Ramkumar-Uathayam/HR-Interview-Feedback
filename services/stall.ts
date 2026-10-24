import { API_BASE_URL } from '../constants.ts';
import { StallCompanyAddress, StallEmployee, StallImportRow, StallPrintSlip } from '../types.ts';

export const STALL_CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]+$/;

// Accepts "E2502217", "e25-02217", " E25-02217 " -> "E25-02217" (same rule as server.js)
export const normalizeEmpCode = (raw: unknown): string => {
  let code = String(raw ?? '').replace(/\s+/g, '').toUpperCase();
  if (code && !code.includes('-') && code.length > 3) {
    code = `${code.slice(0, 3)}-${code.slice(3)}`;
  }
  return code;
};

// Same content as the StallPrintEmployeeQR procedure's QR string
export const buildStallQrData = (slip: StallPrintSlip): string =>
  [slip.empCode, slip.empName, slip.company, slip.department, slip.amount, slip.printDay ?? ''].join('|');

export class StallApiError extends Error {
  constructor(message: string, public status: number, public body: any) {
    super(message);
  }
}

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}/stall${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new StallApiError(body.details || body.error || `Request failed (${response.status})`, response.status, body);
  }
  return body as T;
};

export const fetchStallEmployees = () => request<StallEmployee[]>('/employees');

export const printStallEmployee = (empCode: string, reprint: boolean) =>
  request<StallPrintSlip>('/print', { method: 'POST', body: JSON.stringify({ empCode, reprint }) });

export const importStallEmployees = (rows: StallImportRow[]) =>
  request<{ deleted: number; imported: number }>('/import', { method: 'POST', body: JSON.stringify({ rows }) });

export const fetchStallSettings = () => request<{ amount: string }>('/settings');

export const saveStallSettings = (amount: string) =>
  request<{ success: boolean; amount: string }>('/settings', { method: 'PUT', body: JSON.stringify({ amount }) });

export const fetchStallAddresses =() => request<StallCompanyAddress[]>('/addresses');

export const saveStallAddress = (company: string, address: string) =>
  request<{ success: boolean }>('/addresses', { method: 'PUT', body: JSON.stringify({ company, address }) });

export const deleteStallAddress = (company: string) =>
  request<{ success: boolean }>(`/addresses?company=${encodeURIComponent(company)}`, { method: 'DELETE' });
