import { FeedItem } from "@prisma/client";

export function feedItemToAPI(item: FeedItem) {
    return {
        seq: item.seq,
        content: item.content,
        date: item.createdAt.getTime(),
        by: item.byId,
    };
}