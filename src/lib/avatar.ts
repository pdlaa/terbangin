export function getAvatarUrl(seed: string, style: 'adventurer' | 'big-smile' | 'pixel-art' = 'adventurer'): string {
    const normalized = encodeURIComponent(seed.trim().toLowerCase());
    const service = process.env.NEXT_PUBLIC_AVATAR_SERVICE || process.env.AVATAR_SERVICE || 'dicebear';

    if (service === 'pravatar') {
        return `https://i.pravatar.cc/150?u=${normalized}`;
    }

    return `https://api.dicebear.com/6.0/${style}/svg?seed=${normalized}&backgroundColor=transparent`;
}
