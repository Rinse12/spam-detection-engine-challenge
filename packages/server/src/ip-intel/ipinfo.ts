export interface IpInfoResult {
    countryCode?: string;
    isVpn?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isDatacenter?: boolean;
}

interface IpInfoResponse {
    country?: string;
    bogon?: boolean;
    privacy?: {
        vpn?: boolean;
        proxy?: boolean;
        tor?: boolean;
        hosting?: boolean;
    };
}

export async function fetchIpInfo(params: { ipAddress: string; token: string; timeoutMs?: number }): Promise<IpInfoResult | null> {
    const { ipAddress, token, timeoutMs = 3000 } = params;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const url = new URL(`https://ipinfo.io/${encodeURIComponent(ipAddress)}/json`);
    url.searchParams.set("token", token);

    try {
        const response = await fetch(url, {
            headers: { accept: "application/json" },
            signal: controller.signal
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as IpInfoResponse;

        if (data.bogon) {
            return null;
        }

        const privacy = data.privacy;
        return {
            countryCode: typeof data.country === "string" ? data.country.toUpperCase() : undefined,
            isVpn: privacy !== undefined ? privacy.vpn === true : undefined,
            isProxy: privacy !== undefined ? privacy.proxy === true : undefined,
            isTor: privacy !== undefined ? privacy.tor === true : undefined,
            isDatacenter: privacy !== undefined ? privacy.hosting === true : undefined
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
