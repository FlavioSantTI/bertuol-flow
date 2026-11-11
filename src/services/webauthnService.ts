import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';

export interface WebAuthnDeviceItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  deviceName: string;
  deviceType?: 'singleDevice' | 'multiDevice';
  backedUp?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export const webauthnService = {
  // Check if browser supports WebAuthn API
  isSupported(): boolean {
    try {
      return browserSupportsWebAuthn();
    } catch {
      return false;
    }
  },

  // Check if device hardware has biometric scanner (Face ID, Touch ID, Windows Hello)
  async hasPlatformAuthenticator(): Promise<boolean> {
    try {
      if (!browserSupportsWebAuthn()) return false;
      return await platformAuthenticatorIsAvailable();
    } catch {
      return false;
    }
  },

  // 1-Touch Biometric Login (Discoverable Passkey - no email typing required)
  async loginWithBiometrics(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    isCancelled?: boolean;
  }> {
    try {
      if (!browserSupportsWebAuthn()) {
        return {
          success: false,
          error: 'Este navegador não suporta autenticação biométrica WebAuthn.',
        };
      }

      // Step 1: Request options from server
      const optionsRes = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!optionsRes.ok) {
        const errJson = await optionsRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao iniciar desafio biométrico.');
      }

      const { options } = await optionsRes.json();
      if (!options) {
        throw new Error('Opções de autenticação inválidas retornadas pelo servidor.');
      }

      // Step 2: Trigger native browser biometric prompt (Face ID / Touch ID / Hello)
      let authResponse;
      try {
        authResponse = await startAuthentication({ optionsJSON: options });
      } catch (clientErr: any) {
        console.warn('WebAuthn client error:', clientErr);
        const errMsg = clientErr?.message || '';
        const isAbort =
          errMsg.includes('cancel') ||
          errMsg.includes('Abort') ||
          errMsg.includes('NotAllowedError') ||
          clientErr.name === 'NotAllowedError';

        return {
          success: false,
          isCancelled: isAbort,
          error: isAbort
            ? 'Acesso biométrico cancelado ou expirado. Tente novamente ou acesse com sua senha.'
            : clientErr?.message || 'Erro no leitor biométrico do dispositivo.',
        };
      }

      // Step 3: Send signed assertion to server for cryptographic verification
      const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResponse }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        return {
          success: false,
          error:
            verifyData.error ||
            'Não foi possível validar sua biometria. Registre este dispositivo no perfil ou use sua senha.',
        };
      }

      return {
        success: true,
        user: verifyData.user,
      };
    } catch (err: any) {
      console.error('Erro na autenticação biométrica:', err);
      return {
        success: false,
        error: err.message || 'Erro inesperado na autenticação biométrica.',
      };
    }
  },

  // Register Current Device (Face ID / Touch ID) for Authenticated User
  async registerDevice(
    userId: string,
    userEmail: string,
    userName: string,
    deviceName: string
  ): Promise<{ success: boolean; credential?: any; error?: string }> {
    try {
      if (!browserSupportsWebAuthn()) {
        return {
          success: false,
          error: 'Este navegador não suporta autenticação biométrica WebAuthn.',
        };
      }

      // Step 1: Request registration options from server
      const optRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, userName }),
      });

      if (!optRes.ok) {
        const errJson = await optRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao gerar desafio de registro.');
      }

      const { options } = await optRes.json();

      // Step 2: Trigger native creation prompt
      let regResponse;
      try {
        regResponse = await startRegistration({ optionsJSON: options });
      } catch (clientErr: any) {
        console.warn('WebAuthn registration cancelled/failed:', clientErr);
        const errMsg = clientErr?.message || '';
        const isAbort =
          errMsg.includes('cancel') ||
          errMsg.includes('Abort') ||
          clientErr.name === 'NotAllowedError';

        return {
          success: false,
          error: isAbort
            ? 'Cadastro biométrico cancelado pelo usuário.'
            : clientErr?.message || 'Erro ao registrar credencial no hardware.',
        };
      }

      // Step 3: Send verification to backend
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deviceName: deviceName.trim() || 'Meu Dispositivo',
          response: regResponse,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        return {
          success: false,
          error: verifyData.error || 'Falha na validação criptográfica da chave.',
        };
      }

      return {
        success: true,
        credential: verifyData.credential,
      };
    } catch (err: any) {
      console.error('Erro ao cadastrar dispositivo biométrico:', err);
      return {
        success: false,
        error: err.message || 'Erro inesperado ao registrar biometria.',
      };
    }
  },

  // List all registered devices for user
  async listUserDevices(userId: string): Promise<WebAuthnDeviceItem[]> {
    try {
      const res = await fetch(`/api/auth/webauthn/devices?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.devices || [];
      }
    } catch (err) {
      console.warn('Erro ao listar dispositivos WebAuthn:', err);
    }
    return [];
  },

  // Revoke a registered device
  async deleteDevice(credentialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/auth/webauthn/devices/${encodeURIComponent(credentialId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Falha de conexão ao revogar dispositivo.',
      };
    }
  },
};
