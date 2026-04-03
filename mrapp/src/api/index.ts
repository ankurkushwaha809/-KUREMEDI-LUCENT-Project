import { API_BASE_URL } from '@/src/config';
import { api } from './client';

export const sendOtp = (phone: string) =>
  api.post('/auth/send-otp', { phone }).then((res) => res.data);

export const verifyOtp = (phone: string, otp: string) =>
  api.post('/auth/verify-otp', { phone, otp }).then((res) => res.data);

export const completeRegistration = (
  tempToken: string,
  data: { name: string; email: string; referralCode?: string }
) =>
  api
    .post('/auth/complete-registration', data, {
      headers: { Authorization: `Bearer ${tempToken}` },
    })
    .then((res) => res.data);

export const getMe = () => api.get('/auth/me').then((res) => res.data);

// KYC - PUT /auth/kyc (multipart). Use fetch() so RN FormData file uploads (uri/name/type) work reliably.
const KYC_UPLOAD_TIMEOUT_MS = 120000;

export async function submitKyc(
  formData: FormData,
  token: string
): Promise<{ message: string; user: unknown }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KYC_UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/kyc`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(
        (data && typeof data.message === 'string' ? data.message : null) ||
          `Request failed (${res.status})`
      ) as Error & { response?: { status: number; data?: unknown } };
      err.response = { status: res.status, data };
      throw err;
    }
    return data as { message: string; user: unknown };
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === 'AbortError') {
      const err = new Error('Request timed out. Try again.') as Error & { code?: string };
      err.code = 'ECONNABORTED';
      throw err;
    }
    throw e;
  }
}

export const getWallet = () =>
  api.get('/wallet').then((res) => res.data as { balance: number });

export type ReferralItem = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  kyc: string;
  credited: boolean;
  createdAt: string;
};

export type MyReferralsResponse = {
  count: number;
  kycApproved: number;
  referrals: ReferralItem[];
};

export const getMyReferrals = () =>
  api.get<MyReferralsResponse>('/agents/me/referrals').then((res) => res.data);

// MR Wallet: commission (referral earnings) + withdrawals
export type CommissionEntry = {
  _id: string;
  amount: number;
  type: 'REFERRAL' | 'ORDER' | 'BONUS' | 'PAYOUT';
  description?: string;
  status: string;
  createdAt: string;
};

export type CommissionSummary = {
  totalEarned: number;
  pending: number;
  entries: CommissionEntry[];
};

export const getAgentCommission = () =>
  api.get<CommissionSummary>('/agents/me/commission').then((res) => res.data);

export type WithdrawalItem = {
  _id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
};

export type WithdrawalsResponse = {
  withdrawals: WithdrawalItem[];
  totalEarned: number;
  alreadyWithdrawn: number;
  availableBalance: number;
};

export const getWithdrawals = () =>
  api.get<WithdrawalsResponse>('/agents/me/withdrawals').then((res) => res.data);

export const requestWithdrawal = (amount: number, note?: string) =>
  api
    .post<WithdrawalItem>('/agents/me/withdrawals', { amount, note })
    .then((res) => res.data);

// ——— Support (MR → Admin chat) ———
export type SupportTicketCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'PRODUCT'
  | 'WALLET'
  | 'KYC'
  | 'OTHER';
export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type SupportTicket = {
  _id: string;
  user: string | { _id: string; name?: string; phone?: string };
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  contactPhone?: string;
  contactName?: string;
  initialMessage: string;
  lastMessageAt?: string;
  createdAt?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
};

export type SupportMessage = {
  _id: string;
  ticket: string;
  body: string;
  isFromAdmin: boolean;
  type?: 'message' | 'call_note';
  createdAt?: string;
};

export const createSupportTicket = (data: {
  message: string;
  subject?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  contactPhone?: string;
  contactName?: string;
}) => api.post('/support/tickets', data).then((res) => res.data);

export const getMySupportTickets = () =>
  api
    .get('/support/tickets')
    .then((res) => res.data as { success: boolean; data: SupportTicket[] });

export const getSupportTicketById = (id: string) =>
  api
    .get(`/support/tickets/${id}`)
    .then(
      (res) =>
        res.data as {
          success: boolean;
          data: { ticket: SupportTicket; messages: SupportMessage[] };
        }
    );

export const sendSupportMessage = (ticketId: string, body: string) =>
  api
    .post(`/support/tickets/${ticketId}/messages`, { body })
    .then((res) => res.data as { success: boolean; data: SupportMessage });

export const registerSupportPushToken = (token: string) =>
  api.post('/support/push-token', { token }).then((res) => res.data);
