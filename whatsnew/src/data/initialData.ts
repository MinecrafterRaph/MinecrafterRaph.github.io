import { Chat, ContactStory, Message } from '../types';

// Empty lists - no fake chats, users start fresh and create their real chats!
export const INITIAL_CHATS: Chat[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_STORIES: ContactStory[] = [];
