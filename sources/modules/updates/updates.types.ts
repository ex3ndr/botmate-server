//
// NOTE: This updates are delivered directly to the client.
//

import { Content } from "../feed/types";
import { Memory } from "../feed/memories";


//
// Memories
//

export type UpdateMemoryCreated = {
    type: 'memory-created'
    id: string;
    index: number;
    memory: Memory;
};

export type UpdateMemoryChanged = {
    type: 'memory-changed'
    id: string;
    index: number;
    memory: Memory;
}

//
// Feed
//

export type UpdateFeedPosted = {
    type: 'feed-posted';
    source: string;
    seq: number;
    date: number;
    by: string;
    content: Content;
    repeatKey: string | null;
    localKey?: string | null | undefined;
};

export type UpdateFeedUpdated = {
    type: 'feed-updated';
    source: string;
    seq: number;
    date: number;
    by: string;
    content: Content;
};

export type UpdateFeedDeleted = {
    type: 'feed-deleted';
    source: string;
    seq: number;
};

export type UpdateType = UpdateMemoryCreated | UpdateMemoryChanged | UpdateFeedPosted | UpdateFeedUpdated | UpdateFeedDeleted;