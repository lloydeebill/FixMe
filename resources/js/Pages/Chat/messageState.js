export const mergeMessages = (current, incoming) => {
    const byId = new Map(current.map(message => [String(message.id), message]));
    incoming.forEach(message => byId.set(String(message.id), message));
    return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
};

export const isIncomingForBooking = (event, bookingId, userId) =>
    Number(event.bookingId) === Number(bookingId)
    && Boolean(event.message)
    && Number(event.message.sender_id) !== Number(userId);
