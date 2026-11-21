import type { Role } from '../../src/types';

export interface EnvBindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
  CORS_ORIGIN?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: Role;
}

export interface AppVariables {
  user: AuthUser;
}

export type AppEnv = {
  Bindings: EnvBindings;
  Variables: AppVariables;
};
