import type { SpamDetectionDatabase } from "../db/index.js";
import { fetchIpInfo, type IpInfoResult } from "./ipinfo.js";

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_TIMEOUT_MS = 3000;

function isIntelFresh(intelUpdatedAt: number | null, now: number, ttlSeconds: number): boolean {
    if (!intelUpdatedAt) {
        return false;
    }
    return intelUpdatedAt >= now - ttlSeconds;
}

export async function refreshIpIntelIfNeeded(params: {
    db: SpamDetectionDatabase;
    ipAddress: string;
    author: string;
    token?: string;
    now?: number;
    ttlSeconds?: number;
    timeoutMs?: number;
}): Promise<IpInfoResult | null> {
    const {
        db,
        ipAddress,
        author,
        token,
        now = Math.floor(Date.now() / 1000),
        ttlSeconds = DEFAULT_TTL_SECONDS,
        timeoutMs = DEFAULT_TIMEOUT_MS
    } = params;

    if (!token) {
        return null;
    }

    const record = db.getIpRecordByIpAndAuthor(ipAddress, author);
    if (!record) {
        return null;
    }

    if (isIntelFresh(record.intelUpdatedAt ?? null, now, ttlSeconds)) {
        return null;
    }

    const intel = await fetchIpInfo({ ipAddress, token, timeoutMs });
    if (!intel) {
        return null;
    }

    db.upsertIpRecord({
        ipAddress,
        author,
        challengeId: record.challengeId,
        isVpn: intel.isVpn,
        isProxy: intel.isProxy,
        isTor: intel.isTor,
        isDatacenter: intel.isDatacenter,
        countryCode: intel.countryCode,
        intelUpdatedAt: now
    });

    return intel;
}

export { DEFAULT_TTL_SECONDS };
