import type { SpamDetectionDatabase } from "../db/index.js";
import { fetchIpInfo, type IpInfoResult } from "./ipinfo.js";

const DEFAULT_TIMEOUT_MS = 3000;

export async function refreshIpIntelIfNeeded(params: {
    db: SpamDetectionDatabase;
    sessionId: string;
    token?: string;
    timeoutMs?: number;
}): Promise<IpInfoResult | null> {
    const { db, sessionId, token, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

    if (!token) {
        return null;
    }

    const record = db.getIpRecordBySessionId(sessionId);
    if (!record) {
        return null;
    }

    // Skip if we already have intelligence data
    if (record.isVpn !== null || record.isProxy !== null || record.isTor !== null || record.isDatacenter !== null) {
        return null;
    }

    const intel = await fetchIpInfo({ ipAddress: record.ipAddress, token, timeoutMs });
    if (!intel) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    db.updateIpRecordIntelligence(sessionId, {
        isVpn: intel.isVpn,
        isProxy: intel.isProxy,
        isTor: intel.isTor,
        isDatacenter: intel.isDatacenter,
        countryCode: intel.countryCode,
        timestamp: now
    });

    return intel;
}
