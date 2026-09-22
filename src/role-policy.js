import {PermissionFlagsBits as P} from 'discord.js';
import {rankKey,bothDivisions} from './identity.js';
import {ROLE_ENV} from './config-rules.js';
export const rankRoleKey=member=>member?.account_kind==='aliado'?'ally':({lider:'leader','sub lider':'subleader',sublider:'subleader','high member':'high',moderador:'moderator',recrutador:'recruiter',aliado:'ally',veterano:'veteran',novato:'rookie'}[rankKey(member?.member_rank)]||null);
export const teamMember=member=>member?.account_kind!=='aliado'&&['leader','subleader','moderator'].includes(rankRoleKey(member));
export const managedRoles=d=>[d.memberRole,d.adminRole,...Object.keys(ROLE_ENV).map(k=>d.rankRoles?.[k])].filter(Boolean);
export function wantedRoles(member,d){if(!member?.verified||(!bothDivisions(member)&&member.division!==d.id))return new Set();return new Set([d.memberRole,d.rankRoles?.[rankRoleKey(member)],teamMember(member)?d.adminRole:null].filter(Boolean));}
const dangerous=[P.Administrator,P.ManageGuild,P.ManageRoles,P.ManageChannels,P.ManageWebhooks,P.KickMembers,P.BanMembers,P.ModerateMembers,P.MentionEveryone];
export function assertManagedRoles(g,d,roles,me){
 const ids=managedRoles(d);if(ids.length!==10||new Set(ids).size!==10)throw Error('Configure 10 IDs de cargos distintos por divisão.');
 for(const id of ids){const role=roles.get(id);if(!role||id===g.id||role.managed||dangerous.some(bit=>role.permissions.has(bit))||me.roles.highest.comparePositionTo(role)<=0)throw Error('Cargos automáticos devem existir, ficar abaixo do bot e não ter permissões globais de administração ou gestão.');}
}
export async function synchronizeRoles(g,d,user,member){
 const roles=await g.roles.fetch(),me=await g.members.fetchMe();assertManagedRoles(g,d,roles,me);
 const wanted=wantedRoles(member,d),all=managedRoles(d);
 // Remove obsolete access before granting anything. Never replace unrelated roles.
 for(const id of all)if(!wanted.has(id)&&(!user.roles.cache||user.roles.cache.has(id)))await user.roles.remove(id,'IFJ: acesso/patente revogados ou alterados');
 for(const id of wanted)if(!user.roles.cache||!user.roles.cache.has(id))await user.roles.add(id,'IFJ verificado: acesso e patente');
}
