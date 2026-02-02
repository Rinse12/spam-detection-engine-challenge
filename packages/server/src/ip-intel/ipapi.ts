export interface IpApiResult {
    countryCode?: string;
    isVpn?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isDatacenter?: boolean;
}

interface IpApiResponse {
    location?: {
        country_code?: string;
    };
    is_vpn?: boolean;
    is_proxy?: boolean;
    is_tor?: boolean;
    is_datacenter?: boolean;
    is_bogon?: boolean;
}

export async function fetchIpApi(params: { ipAddress: string; apiKey?: string; timeoutMs?: number }): Promise<IpApiResult | null> {
    const { ipAddress, apiKey, timeoutMs = 3000 } = params;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const url = new URL("https://api.ipapi.is");
    url.searchParams.set("q", ipAddress);
    if (apiKey) {
        url.searchParams.set("key", apiKey);
    }

    try {
        const response = await fetch(url, {
            headers: { accept: "application/json" },
            signal: controller.signal
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as IpApiResponse;

        if (data.is_bogon) {
            return null;
        }

        return {
            countryCode: typeof data.location?.country_code === "string" ? data.location.country_code.toUpperCase() : undefined,
            isVpn: data.is_vpn,
            isProxy: data.is_proxy,
            isTor: data.is_tor,
            isDatacenter: data.is_datacenter
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
