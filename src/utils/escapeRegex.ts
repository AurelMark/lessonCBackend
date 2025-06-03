export function escapeRegex(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
