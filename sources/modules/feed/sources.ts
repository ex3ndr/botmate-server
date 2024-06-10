import { FeedSource } from "./types";

export function getFeedTag(src: FeedSource) {
    if (src.type === 'default') {
        return 'default';
    }
    if (src.type === 'default-ai') {
        return 'default-ai';
    }
    if (src.type === 'ai') {
        return `ai-${src.id}`;
    }
    if (src.type === 'smart') {
        return 'smart';
    }

    throw new Error('Invalid feed tag');
}

export function getFeedPublicID(src: FeedSource) {
    if (src.type === 'default') {
        return 'default';
    }
    if (src.type === 'default-ai') {
        return 'ai';
    }
    if (src.type === 'ai') {
        return `ai_${src.id}`;
    }
    if (src.type === 'smart') {
        return 'smart';
    }

    throw new Error('Invalid feed tag');
}

export function getFeedSourceFromPublicID(publicId: string): FeedSource {
    if (publicId === 'default') {
        return { type: 'default' };
    }
    if (publicId === 'ai') {
        return { type: 'default-ai' };
    }
    if (publicId === 'smart') {
        return { type: 'smart' };
    }
    if (publicId.startsWith('ai_')) {
        return { type: 'ai', id: publicId.slice(3) };
    }

    throw new Error('Invalid feed tag');
}