import { Conversation, Message, ConversationParticipant } from '../types/database';

export interface CreateConversationPayload {
  clinicId: number;
  patientName: string;
  patientPhone?: string;
  subject?: string;
  initialMessage: string;
  senderType: 'patient' | 'staff' | 'dentist';
  senderName: string;
  senderUserId?: string;
  clientMessageId?: string;
}

export interface SendMessagePayload {
  body: string;
  senderType: 'patient' | 'staff' | 'dentist';
  senderName: string;
  senderUserId?: string;
  senderPatientId?: string;
  clientMessageId?: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'image' | 'video' | 'document';
  mediaMimeType?: string;
  mediaSizeBytes?: number;
  mediaDurationSeconds?: number;
  mediaThumbnailUrl?: string;
}

export interface FetchConversationsParams {
  clinicId?: number | 'all';
  patientPhone?: string;
  patientName?: string;
  status?: string;
  dentistName?: string;
  dentistId?: number;
  role?: string;
  scope?: string;
}

class MessagingService {
  private baseUrl = '/api/conversations';
  private cachedConversations = new Map<string, Conversation[]>();

  private async safeFetchJson(url: string, options?: RequestInit, retries = 1): Promise<any> {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (res.status >= 500 && retries > 0) {
          await new Promise((r) => setTimeout(r, 500));
          return this.safeFetchJson(url, options, retries - 1);
        }
        return null;
      }
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      if (!contentType.includes('application/json') && text.trim().startsWith('<')) {
        console.warn(`[MessagingService] Resposta HTML (não-JSON) recebida de ${url}. Endpoint pode estar em fallback.`);
        return null;
      }

      try {
        return JSON.parse(text);
      } catch {
        console.warn(`[MessagingService] Resposta não-JSON de ${url}`);
        return null;
      }
    } catch (e) {
      if (retries > 0) {
        // Tentativa de reconexão automática caso o servidor esteja reiniciando ou reconectando
        await new Promise((r) => setTimeout(r, 600));
        return this.safeFetchJson(url, options, retries - 1);
      }
      console.warn(`[MessagingService] Requisição temporariamente indisponível para ${url}:`, e);
      return null;
    }
  }

  public async getConversations(params: FetchConversationsParams = {}): Promise<Conversation[]> {
    const searchParams = new URLSearchParams();
    if (params.clinicId !== undefined && params.clinicId !== 'all') {
      searchParams.set('clinicId', String(params.clinicId));
    }
    if (params.patientPhone) searchParams.set('patientPhone', params.patientPhone);
    if (params.patientName) searchParams.set('patientName', params.patientName);
    if (params.status) searchParams.set('status', params.status);
    if (params.dentistName) searchParams.set('dentistName', params.dentistName);
    if (params.dentistId) searchParams.set('dentistId', String(params.dentistId));
    if (params.role) searchParams.set('role', params.role);
    if (params.scope) searchParams.set('scope', params.scope);

    const cacheKey = searchParams.toString();
    const url = `${this.baseUrl}?${cacheKey}`;

    try {
      const data = await this.safeFetchJson(url);
      if (data && Array.isArray(data.conversations)) {
        this.cachedConversations.set(cacheKey, data.conversations);
        return data.conversations;
      }
      return this.cachedConversations.get(cacheKey) || [];
    } catch (e) {
      console.warn('[MessagingService] Aviso ao buscar conversas:', e);
      return this.cachedConversations.get(cacheKey) || [];
    }
  }

  public async getRecentStaffAlert(): Promise<{
    id: string;
    conversationId: string;
    patientName: string;
    patientPhone?: string;
    clinicId: number;
    message: string;
    timestamp: string;
  } | null> {
    try {
      const data = await this.safeFetchJson(`${this.baseUrl}/recent-staff-alert`);
      return data?.alert || null;
    } catch {
      return null;
    }
  }

  public async dismissStaffAlert(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/recent-staff-alert/dismiss`, { method: 'POST' });
    } catch {}
  }

  public async getMessages(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
    participants: ConversationParticipant[];
  } | null> {
    try {
      const url = `${this.baseUrl}/${conversationId}/messages`;
      const data = await this.safeFetchJson(url);
      return data || null;
    } catch (e) {
      console.warn('[MessagingService] Erro ao buscar mensagens:', e);
      return null;
    }
  }

  public async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<Message | null> {
    try {
      const clientMessageId = payload.clientMessageId || crypto.randomUUID();
      const url = `${this.baseUrl}/${conversationId}/messages`;
      const data = await this.safeFetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, clientMessageId }),
      });
      return data?.message || null;
    } catch (e) {
      console.warn('[MessagingService] Erro ao enviar mensagem:', e);
      return null;
    }
  }

  public async createConversation(
    payload: CreateConversationPayload
  ): Promise<{ conversation: Conversation; message: Message } | null> {
    try {
      const clientMessageId = payload.clientMessageId || crypto.randomUUID();
      const data = await this.safeFetchJson(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, clientMessageId }),
      });
      if (!data?.conversation) return null;
      return { conversation: data.conversation, message: data.message };
    } catch (e) {
      console.warn('[MessagingService] Erro ao criar conversa:', e);
      return null;
    }
  }

  public async assignConversation(
    conversationId: string,
    assignedToUserId: string,
    assignedToName: string,
    actorName: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToUserId,
          assignedToName,
          actorName,
          actorType: 'staff',
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[MessagingService] Erro ao transferir conversa:', e);
      return false;
    }
  }

  public async addParticipant(
    conversationId: string,
    userId: string,
    userName: string,
    participantType: 'dentist' | 'staff',
    addedBy: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${conversationId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          participantType,
          addedBy,
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[MessagingService] Erro ao adicionar participante:', e);
      return false;
    }
  }

  public async updateStatus(
    conversationId: string,
    status: 'open' | 'pending' | 'closed',
    actorName: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorName,
          actorType: 'staff',
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[MessagingService] Erro ao atualizar status:', e);
      return false;
    }
  }

  public async markAsRead(conversationId: string, forRole: 'patient' | 'staff'): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forRole }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[MessagingService] Erro ao marcar como lido:', e);
      return false;
    }
  }

  public async uploadMedia(
    file: File | Blob,
    fileName: string,
    fileType: 'audio' | 'image' | 'video' | 'document',
    durationSeconds?: number
  ): Promise<{ url: string; sizeBytes: number } | null> {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName,
          fileType,
          mimeType: file.type || 'application/octet-stream',
          durationSeconds,
        }),
      });
      if (!res.ok) throw new Error('Falha no upload de mídia');
      const data = await res.json();
      return {
        url: data.url || fileData,
        sizeBytes: data.sizeBytes || file.size,
      };
    } catch (e) {
      console.warn('[MessagingService] Erro no upload de mídia:', e);
      return null;
    }
  }
}

export const messagingService = new MessagingService();
