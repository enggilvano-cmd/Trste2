import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { accessExpiresAt, enforceExpiration, logAudit } from '@/lib/user-access';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // e-mail sem espaços e sem diferença de maiúsculas (o preenchimento automático do navegador pode alterar)
        const email = String(credentials.email).trim();
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });
        if (!user) return null;
        const isValid = await bcrypt.compare(String(credentials.password), user.password);
        if (!isValid) return null;
        // trial/assinatura vencidos desativam a conta (regra do app de referência)
        const active = await enforceExpiration(user);
        if (!active) return null;
        await logAudit({ userId: user.id, action: 'user_login', resourceType: 'auth', resourceId: user.id });
        return { id: user.id, email: user.email, name: user.name, role: user.role, isActive: true };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id = user.id;
      if (!token?.id) return token;
      // Relê o usuário a cada verificação: mudanças de perfil, desativação, vencimento
      // ou exclusão feitas pelo administrador valem imediatamente.
      const u = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { id: true, name: true, email: true, role: true, isActive: true, trialExpiresAt: true, subscriptionExpiresAt: true },
      });
      if (!u) return null;
      const active = await enforceExpiration(u);
      if (!active) return null;
      token.role = u.role;
      token.isActive = true;
      token.name = u.name;
      token.email = u.email;
      token.expiresAt = accessExpiresAt(u)?.toISOString() ?? null;
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
        session.user.expiresAt = (token.expiresAt as string | null) ?? null;
      }
      return session;
    },
  },
});
