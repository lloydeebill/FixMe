const messageOrder = (left, right) => {
    const byTime = (Date.parse(right.last_message_at) || 0) - (Date.parse(left.last_message_at) || 0);
    return byTime || (Number(right.last_message_id || 0) - Number(left.last_message_id || 0));
};

export const sortConversations = conversations => [...conversations].sort(messageOrder);

export function applyConversationEvent(conversations, event, currentUserId) {
    const bookingId = Number(event?.bookingId);
    const message = event?.message;
    if (!bookingId || !message?.id || Number(message.sender_id) === Number(currentUserId)) return conversations;

    const index = conversations.findIndex(chat => Number(chat.booking_id) === bookingId);
    if (index < 0) return conversations;

    const parsedAt = Date.parse(message.created_at);
    if (!Number.isFinite(parsedAt)) return conversations;
    const incomingAt = new Date(parsedAt).toISOString();
    const current = conversations[index];
    const currentAt = Date.parse(current.last_message_at) || 0;
    if (currentAt && (
        currentAt > parsedAt ||
        (currentAt === parsedAt && Number(current.last_message_id) >= Number(message.id))
    )) return conversations;

    const updated = [...conversations];
    updated[index] = {
        ...current,
        last_message_content: message.content,
        last_message_time: 'Just now',
        last_message_at: incomingAt,
        last_message_id: message.id,
    };
    return sortConversations(updated);
}
