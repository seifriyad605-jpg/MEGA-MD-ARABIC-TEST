function normalize(value = '') {
    return String(value || '').split('@')[0].split(':')[0];
}

function full(value = '') {
    return String(value || '').trim();
}

function isAdminRole(participant) {
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

function matchesIdentity(participant, identities) {
    const ids = new Set(
        identities.filter(Boolean).flatMap(v => [full(v), normalize(v)]).filter(Boolean)
    );

    const candidates = [
        participant?.id,
        participant?.lid,
        participant?.phoneNumber
    ].filter(Boolean);

    return candidates.some(candidate => {
        const cFull = full(candidate);
        const cNum = normalize(candidate);
        return ids.has(cFull) || ids.has(cNum);
    });
}

async function isAdmin(sock, chatId, senderId) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];

        const botIdentities = [
            sock.user?.id,
            sock.user?.lid,
            sock.user?.jid,
            sock.user?.phoneNumber
        ].filter(Boolean);

        const senderIdentities = [
            senderId
        ].filter(Boolean);

        let isBotAdmin = participants.some(
            p => isAdminRole(p) && matchesIdentity(p, botIdentities)
        );

        let isSenderAdmin = participants.some(
            p => isAdminRole(p) && matchesIdentity(p, senderIdentities)
        );

        // WhatsApp can expose the bot through a LID while the participant list
        // exposes its phone JID (or the reverse). Try cross-matching every
        // known bot identity against every participant identity.
        if (!isBotAdmin) {
            const botNumbers = new Set(botIdentities.map(normalize).filter(Boolean));
            isBotAdmin = participants.some(p => {
                if (!isAdminRole(p)) return false;
                return [p.id, p.lid, p.phoneNumber]
                    .filter(Boolean)
                    .some(v => botNumbers.has(normalize(v)));
            });
        }

        if (!isSenderAdmin) {
            const senderNumbers = new Set(senderIdentities.map(normalize).filter(Boolean));
            isSenderAdmin = participants.some(p => {
                if (!isAdminRole(p)) return false;
                return [p.id, p.lid, p.phoneNumber]
                    .filter(Boolean)
                    .some(v => senderNumbers.has(normalize(v)));
            });
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (err) {
        console.error('❌ Error in isAdmin:', err);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

export default isAdmin;
