import * as z from 'zod';

export type FeedSource = {
    type: 'default'
} | {
    type: 'default-ai'
} | {
    type: 'smart'
} | {
    type: 'ai',
    id: string
}

export type Content = {
    kind: 'text',
    text: string
} | {
    kind: 'memory',
    id: string
};

export const contentCodec = z.union([z.object({
    kind: z.literal('text'),
    text: z.string()
}), z.object({
    kind: z.literal('transcription'),
    transcription: z.union([z.array(z.object({
        sender: z.string(),
        text: z.string()
    })), z.string()])
}), z.object({
    kind: z.literal('memory'),
    id: z.string()
}), z.object({
    kind: z.literal('transcriptions'),
    sessions: z.array(z.string())
})]);