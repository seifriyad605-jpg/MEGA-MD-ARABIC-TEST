// Keep outgoing messages compatible with all WhatsApp clients.
// Do NOT use externalAdReply here: some recipient clients can suppress
// the entire message when this metadata is attached, even though the
// sender/linked device can still see it.
const channelInfo = {
    contextInfo: {
        forwardingScore: 0,
        isForwarded: false
    }
};

export { channelInfo };
