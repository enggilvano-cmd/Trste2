import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isActive: boolean;
      /** Vencimento do trial/assinatura (ISO); null quando o perfil não expira. */
      expiresAt?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    role: string;
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
    expiresAt?: string | null;
  }
}
