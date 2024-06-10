export type KnownRoles = 'workers' | 'api' | 'public-api';
const roles = new Set<string>(process.env.ROLES ? process.env.ROLES.split(',') as string[] : ['all']);

export function hasRole(role: KnownRoles) {
    return roles.has(role) || roles.has('all');
}