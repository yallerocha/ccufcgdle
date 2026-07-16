// Filled backgrounds for initials avatars. The same name always maps to the
// same brand color, so a player's fallback avatar looks identical everywhere
// (podium, rankings, members grid, modals) and white text stays readable.
const AVATAR_COLORS = [
  '#4ab5c4', // lsd-teal
  '#4562c1', // lsd-blue
  '#6b52a4', // lsd-purple
  '#a55a8e', // lsd-magenta
  '#de5d60', // lsd-red
  '#e19d53', // lsd-orange
];

export function avatarColorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
