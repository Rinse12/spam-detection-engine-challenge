# Risk Score Scenarios

_Generated: 2026-01-29_

This document shows how risk scores are calculated for various user scenarios across different
configuration combinations. Each scenario represents a realistic user profile with specific
behavioral patterns.

## Configuration Variables

Each scenario is tested against all combinations of:

**IP Intelligence:**

- No IP check (disabled)
- Residential IP (low risk)
- Datacenter IP (elevated risk)
- VPN detected (high risk)
- Tor exit node (very high risk)

**OAuth Configuration:**

- OAuth disabled
- OAuth enabled but user not verified
- Google verified
- Google + GitHub verified

**Publication Types:** Posts, Replies, Votes

**Total: 5 IP types × 4 OAuth configs × 3 publication types = 60 configurations per scenario**

## Challenge Tier Thresholds

| Score Range | Tier            | Action                                  |
| ----------- | --------------- | --------------------------------------- |
| 0.0 - 0.2   | Auto-accepted   | No challenge required                   |
| 0.2 - 0.4   | CAPTCHA only    | CAPTCHA verification required           |
| 0.4 - 0.8   | CAPTCHA + OAuth | Both CAPTCHA and OAuth sign-in required |
| 0.8 - 1.0   | Auto-rejected   | Publication automatically rejected      |

---

## Scenario 1: Brand New User

A completely new user making their first post with no history.

**Example Publication:**

```
title: "First time posting here!"
content: "Hey everyone, just discovered plebbit and wanted to introduce myself..."
```

**Author Profile:**

| Attribute          | Value      | Risk Implication       |
| ------------------ | ---------- | ---------------------- |
| Account Age        | no history | High risk (no history) |
| Karma              | no data    | Unknown (neutral)      |
| Bans               | 0          | Skipped (no history)   |
| Velocity           | normal     | No risk                |
| Content Duplicates | none       | Low risk (unique)      |
| URL Spam           | no urls    | Low risk               |
| ModQueue Rejection | No data    | Unknown (neutral)      |
| Removal Rate       | No data    | Unknown (neutral)      |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.42  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.38  | CAPTCHA only    | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.36  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.51  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| VPN         | OAuth disabled             | 0.52  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| Tor         | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.42  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.38  | CAPTCHA only    | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.36  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.51  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| VPN         | OAuth disabled             | 0.52  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| Tor         | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.58  | CAPTCHA + OAuth | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.64  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.49  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.51  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.41  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.38  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.61  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.66  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history)            |
| VPN         | OAuth disabled             | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)             |
| Tor         | OAuth disabled             | 0.70  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.64  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 1.00  | no history     | 18.4%    | 0.18         |
| Karma Score         | 0.60  | no data        | 15.8%    | 0.09         |
| Content/Title Risk  | 0.20  | unique content | 18.4%    | 0.04         |
| URL/Link Risk       | 0.20  | no URLs        | 15.8%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 13.2%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | -     | no bans        | 0%       | (skipped)    |
| ModQueue Rejection  | 0.50  | no data        | 7.9%     | 0.04         |
| Removal Rate        | 0.50  | no data        | 10.5%    | 0.05         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.45**     |

**Outcome:** CAPTCHA + OAuth — Score 0.45 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 2: Established Trusted User

A well-established user with 90+ days history, positive karma, and Google verification.

**Example Publication:**

```
title: "Question about plebbit development"
content: "Has anyone figured out how to run a subplebbit on a VPS? I've been here a while and still learning..."
```

**Author Profile:**

| Attribute          | Value   | Risk Implication        |
| ------------------ | ------- | ----------------------- |
| Account Age        | 90 days | Low risk (established)  |
| Karma              | +5      | Low risk (positive)     |
| Bans               | 0       | Low risk (clean record) |
| Velocity           | normal  | No risk                 |
| Content Duplicates | none    | Low risk (unique)       |
| URL Spam           | no urls | Low risk                |
| ModQueue Rejection | 0%      | Low risk                |
| Removal Rate       | 0%      | Low risk                |
| OAuth Verification | google  | Reduced risk (verified) |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                 |
| ----------- | -------------------------- | ----- | ------------- | --------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.13  | Auto-accepted | Account Age (0.20, 90+ days), Content/Title Risk (0.20, unique content)     |
| No IP check | OAuth enabled (unverified) | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google verified            | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google + GitHub verified   | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| Residential | OAuth disabled             | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Account Age (0.20, 90+ days)                |
| Residential | OAuth enabled (unverified) | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google verified            | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google + GitHub verified   | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Datacenter  | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Account Age (0.20, 90+ days)                 |
| Datacenter  | OAuth enabled (unverified) | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google verified            | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google + GitHub verified   | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| VPN         | OAuth disabled             | 0.28  | CAPTCHA only  | IP Risk (0.75, VPN detected), Account Age (0.20, 90+ days)                  |
| VPN         | OAuth enabled (unverified) | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google verified            | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google + GitHub verified   | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| Tor         | OAuth disabled             | 0.32  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Account Age (0.20, 90+ days)                 |
| Tor         | OAuth enabled (unverified) | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google verified            | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google + GitHub verified   | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                 |
| ----------- | -------------------------- | ----- | ------------- | --------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.13  | Auto-accepted | Account Age (0.20, 90+ days), Content/Title Risk (0.20, unique content)     |
| No IP check | OAuth enabled (unverified) | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google verified            | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google + GitHub verified   | 0.16  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| Residential | OAuth disabled             | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Account Age (0.20, 90+ days)                |
| Residential | OAuth enabled (unverified) | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google verified            | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google + GitHub verified   | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Datacenter  | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Account Age (0.20, 90+ days)                 |
| Datacenter  | OAuth enabled (unverified) | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google verified            | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google + GitHub verified   | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| VPN         | OAuth disabled             | 0.28  | CAPTCHA only  | IP Risk (0.75, VPN detected), Account Age (0.20, 90+ days)                  |
| VPN         | OAuth enabled (unverified) | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google verified            | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google + GitHub verified   | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| Tor         | OAuth disabled             | 0.32  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Account Age (0.20, 90+ days)                 |
| Tor         | OAuth enabled (unverified) | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google verified            | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google + GitHub verified   | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                 |
| ----------- | -------------------------- | ----- | ------------- | --------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.11  | Auto-accepted | Account Age (0.20, 90+ days), Karma Score (0.10, positive (+5))             |
| No IP check | OAuth enabled (unverified) | 0.14  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google verified            | 0.14  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| No IP check | Google + GitHub verified   | 0.14  | Auto-accepted | Social Verification (0.40, google verified), Account Age (0.20, 90+ days)   |
| Residential | OAuth disabled             | 0.13  | Auto-accepted | IP Risk (0.20, residential IP), Account Age (0.20, 90+ days)                |
| Residential | OAuth enabled (unverified) | 0.16  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google verified            | 0.16  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Residential | Google + GitHub verified   | 0.16  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, google verified) |
| Datacenter  | OAuth disabled             | 0.28  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Account Age (0.20, 90+ days)                 |
| Datacenter  | OAuth enabled (unverified) | 0.30  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google verified            | 0.30  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| Datacenter  | Google + GitHub verified   | 0.30  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, google verified)  |
| VPN         | OAuth disabled             | 0.30  | CAPTCHA only  | IP Risk (0.75, VPN detected), Account Age (0.20, 90+ days)                  |
| VPN         | OAuth enabled (unverified) | 0.31  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google verified            | 0.31  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| VPN         | Google + GitHub verified   | 0.31  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, google verified)   |
| Tor         | OAuth disabled             | 0.36  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Account Age (0.20, 90+ days)                 |
| Tor         | OAuth enabled (unverified) | 0.36  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google verified            | 0.36  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |
| Tor         | Google + GitHub verified   | 0.36  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, google verified)  |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.20  | 90+ days       | 16.3%    | 0.03         |
| Karma Score         | 0.10  | positive (+5)  | 14.0%    | 0.01         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.6%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.10  | 0% rejected    | 7.0%     | 0.01         |
| Removal Rate        | 0.10  | 0% removed     | 9.3%     | 0.01         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.13**     |

**Outcome:** Auto-accepted — Score 0.13 falls in the auto-accept tier (< 0.2), allowing the publication without any challenge.

---

## Scenario 3: New User with Link

A very new user (<1 day) posting with a single URL.

**Example Publication:**

```
link: "https://myblog.example.com/decentralization-thoughts"
title: "I wrote about my experience with decentralized social media"
content: "Check out my thoughts on the future of social platforms..."
```

**Author Profile:**

| Attribute          | Value    | Risk Implication      |
| ------------------ | -------- | --------------------- |
| Account Age        | <1 day   | High risk (very new)  |
| Karma              | no data  | Unknown (neutral)     |
| Bans               | 0        | Skipped (no history)  |
| Velocity           | normal   | No risk               |
| Content Duplicates | none     | Low risk (unique)     |
| URL Spam           | 1 unique | Low risk (single URL) |
| ModQueue Rejection | No data  | Unknown (neutral)     |
| Removal Rate       | No data  | Unknown (neutral)     |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.43  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.48  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.36  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.36  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.43  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.48  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.36  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.36  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.54  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| No IP check | Google + GitHub verified   | 0.49  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth disabled             | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.41  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Residential | Google + GitHub verified   | 0.38  | CAPTCHA only    | Account Age (0.85, <1 day old), Karma Score (0.60, no data)              |
| Datacenter  | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.64  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.61  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.65  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.67  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.71  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.64  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.85  | <1 day old     | 18.4%    | 0.16         |
| Karma Score         | 0.60  | no data        | 15.8%    | 0.09         |
| Content/Title Risk  | 0.20  | unique content | 18.4%    | 0.04         |
| URL/Link Risk       | 0.20  | 1 unique URL   | 15.8%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 13.2%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | -     | no bans        | 0%       | (skipped)    |
| ModQueue Rejection  | 0.50  | no data        | 7.9%     | 0.04         |
| Removal Rate        | 0.50  | no data        | 10.5%    | 0.05         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.43**     |

**Outcome:** CAPTCHA + OAuth — Score 0.43 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 4: Repeat Link Spammer

A user with negative karma, 1 ban, posting the same link repeatedly.

**Example Publication:**

```
link: "https://sketchy.io/buy/crypto?ref=abc123"
title: "FREE CRYPTO - Don't miss out!!!"
content: "Click here for FREE money!!!"
```

**Author Profile:**

| Attribute          | Value    | Risk Implication         |
| ------------------ | -------- | ------------------------ |
| Account Age        | 7 days   | Moderate risk            |
| Karma              | -5       | High risk (negative)     |
| Bans               | 1        | Moderate risk            |
| Velocity           | elevated | Moderate risk            |
| Content Duplicates | none     | Low risk (unique)        |
| URL Spam           | 5+ same  | High risk (repeated URL) |
| ModQueue Rejection | 50%      | Moderate risk            |
| Removal Rate       | 30%      | Moderate risk            |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                 |
| ----------- | -------------------------- | ----- | --------------- | --------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.55  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | Google verified            | 0.54  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | OAuth disabled             | 0.47  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.47  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Datacenter  | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | Google + GitHub verified   | 0.58  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| VPN         | OAuth disabled             | 0.60  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | OAuth enabled (unverified) | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | Google verified            | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | Google + GitHub verified   | 0.59  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| Tor         | OAuth disabled             | 0.65  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | OAuth enabled (unverified) | 0.68  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | Google verified            | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | Google + GitHub verified   | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                 |
| ----------- | -------------------------- | ----- | --------------- | --------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.55  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | Google verified            | 0.54  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| No IP check | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | OAuth disabled             | 0.47  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.47  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Residential | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | URL/Link Risk (1.00, 5+ same URL), Karma Score (0.90, negative karma)       |
| Datacenter  | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| Datacenter  | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), URL/Link Risk (1.00, 5+ same URL)            |
| VPN         | OAuth disabled             | 0.60  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | OAuth enabled (unverified) | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | Google verified            | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| VPN         | Google + GitHub verified   | 0.56  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), URL/Link Risk (1.00, 5+ same URL)             |
| Tor         | OAuth disabled             | 0.65  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | OAuth enabled (unverified) | 0.68  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | Google verified            | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |
| Tor         | Google + GitHub verified   | 0.60  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), URL/Link Risk (1.00, 5+ same URL)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                  |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.55  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| No IP check | OAuth enabled (unverified) | 0.60  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.53  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| Residential | OAuth disabled             | 0.43  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| Residential | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Karma Score (0.90, negative karma) |
| Residential | Google verified            | 0.43  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| Residential | Google + GitHub verified   | 0.40  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth disabled             | 0.58  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | OAuth enabled (unverified) | 0.63  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)      |
| Datacenter  | Google verified            | 0.56  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| VPN         | OAuth disabled             | 0.60  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | OAuth enabled (unverified) | 0.64  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)       |
| VPN         | Google verified            | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| Tor         | OAuth disabled             | 0.66  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | OAuth enabled (unverified) | 0.70  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)      |
| Tor         | Google verified            | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.50  | ~7 days        | 16.3%    | 0.08         |
| Karma Score         | 0.90  | negative karma | 14.0%    | 0.13         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 1.00  | 5+ same URL    | 14.0%    | 0.14         |
| Velocity            | 0.40  | elevated rate  | 11.6%    | 0.05         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.40  | 1 ban          | 11.6%    | 0.05         |
| ModQueue Rejection  | 0.50  | 50% rejected   | 7.0%     | 0.03         |
| Removal Rate        | 0.50  | 30% removed    | 9.3%     | 0.05         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.55**     |

**Outcome:** CAPTCHA + OAuth — Score 0.55 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 5: Content Duplicator

A user spamming the same content across multiple posts.

**Example Publication:**

```
title: "Amazing opportunity you can't miss"
content: "This is duplicate spam content that appears multiple times."
```

**Author Profile:**

| Attribute          | Value    | Risk Implication         |
| ------------------ | -------- | ------------------------ |
| Account Age        | 30 days  | Low-moderate risk        |
| Karma              | 0        | Neutral                  |
| Bans               | 0        | Low risk (clean record)  |
| Velocity           | elevated | Moderate risk            |
| Content Duplicates | 5+       | High risk (spam pattern) |
| URL Spam           | no urls  | Low risk                 |
| ModQueue Rejection | No data  | Unknown (neutral)        |
| Removal Rate       | No data  | Unknown (neutral)        |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                        |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.35  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| No IP check | OAuth enabled (unverified) | 0.40  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Content/Title Risk (0.55, 5+ duplicates) |
| No IP check | Google verified            | 0.35  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.36  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.30  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | OAuth enabled (unverified) | 0.36  | CAPTCHA only    | Social Verification (1.00, not verified), Content/Title Risk (0.55, 5+ duplicates) |
| Residential | Google verified            | 0.31  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | Google + GitHub verified   | 0.31  | CAPTCHA only    | Velocity (0.70, elevated rate), Content/Title Risk (0.55, 5+ duplicates)           |
| Datacenter  | OAuth disabled             | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Content/Title Risk (0.55, 5+ duplicates)            |
| Datacenter  | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)            |
| Datacenter  | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Content/Title Risk (0.55, 5+ duplicates)            |
| Datacenter  | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.70, elevated rate)                      |
| VPN         | OAuth disabled             | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Content/Title Risk (0.55, 5+ duplicates)             |
| VPN         | OAuth enabled (unverified) | 0.48  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)             |
| VPN         | Google verified            | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Content/Title Risk (0.55, 5+ duplicates)             |
| VPN         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.70, elevated rate)                       |
| Tor         | OAuth disabled             | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Content/Title Risk (0.55, 5+ duplicates)            |
| Tor         | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)            |
| Tor         | Google verified            | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Content/Title Risk (0.55, 5+ duplicates)            |
| Tor         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.70, elevated rate)                      |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                        |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.35  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| No IP check | OAuth enabled (unverified) | 0.40  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Content/Title Risk (0.55, 5+ duplicates) |
| No IP check | Google verified            | 0.35  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.33  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.30  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | OAuth enabled (unverified) | 0.36  | CAPTCHA only    | Social Verification (1.00, not verified), Content/Title Risk (0.55, 5+ duplicates) |
| Residential | Google verified            | 0.31  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Residential | Google + GitHub verified   | 0.29  | CAPTCHA only    | Content/Title Risk (0.55, 5+ duplicates), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth disabled             | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Content/Title Risk (0.55, 5+ duplicates)            |
| Datacenter  | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)            |
| Datacenter  | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Content/Title Risk (0.55, 5+ duplicates)            |
| Datacenter  | Google + GitHub verified   | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Content/Title Risk (0.55, 5+ duplicates)            |
| VPN         | OAuth disabled             | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Content/Title Risk (0.55, 5+ duplicates)             |
| VPN         | OAuth enabled (unverified) | 0.48  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)             |
| VPN         | Google verified            | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Content/Title Risk (0.55, 5+ duplicates)             |
| VPN         | Google + GitHub verified   | 0.40  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Content/Title Risk (0.55, 5+ duplicates)             |
| Tor         | OAuth disabled             | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Content/Title Risk (0.55, 5+ duplicates)            |
| Tor         | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)            |
| Tor         | Google verified            | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Content/Title Risk (0.55, 5+ duplicates)            |
| Tor         | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Content/Title Risk (0.55, 5+ duplicates)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.33  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | OAuth enabled (unverified) | 0.41  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.34  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | Google + GitHub verified   | 0.31  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| Residential | OAuth disabled             | 0.28  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | OAuth enabled (unverified) | 0.36  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| Residential | Google verified            | 0.29  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | Google + GitHub verified   | 0.26  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Datacenter  | OAuth disabled             | 0.43  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.43  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | Google + GitHub verified   | 0.40  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| VPN         | OAuth disabled             | 0.44  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.44  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | Google + GitHub verified   | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| Tor         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | OAuth enabled (unverified) | 0.56  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description   | Weight   | Contribution |
| ------------------- | ----- | ------------- | -------- | ------------ |
| Account Age         | 0.35  | ~30 days      | 16.3%    | 0.06         |
| Karma Score         | 0.60  | neutral       | 14.0%    | 0.08         |
| Content/Title Risk  | 0.55  | 5+ duplicates | 16.3%    | 0.09         |
| URL/Link Risk       | 0.20  | no URLs       | 14.0%    | 0.03         |
| Velocity            | 0.40  | elevated rate | 11.6%    | 0.05         |
| IP Risk             | -     | skipped       | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans       | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.50  | no data       | 7.0%     | 0.03         |
| Removal Rate        | 0.10  | no data       | 9.3%     | 0.01         |
| Social Verification | -     | skipped       | 0%       | (skipped)    |
| **Total**           |       |               | **100%** | **0.35**     |

**Outcome:** CAPTCHA only — Score 0.35 falls in the CAPTCHA-only tier (0.2-0.4), requiring a CAPTCHA challenge before publishing.

---

## Scenario 6: Bot-like Velocity

A very new user posting at automated/bot-like rates.

**Example Publication:**

```
title: "Post #47 in the last hour"
content: "Automated content generation test message..."
```

**Author Profile:**

| Attribute          | Value    | Risk Implication          |
| ------------------ | -------- | ------------------------- |
| Account Age        | <1 day   | High risk (very new)      |
| Karma              | no data  | Unknown (neutral)         |
| Bans               | 0        | Skipped (no history)      |
| Velocity           | bot_like | Very high risk (bot-like) |
| Content Duplicates | none     | Low risk (unique)         |
| URL Spam           | no urls  | Low risk                  |
| ModQueue Rejection | No data  | Unknown (neutral)         |
| Removal Rate       | No data  | Unknown (neutral)         |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.54  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | OAuth enabled (unverified) | 0.58  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.44  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Datacenter  | OAuth disabled             | 0.58  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.56  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.64  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.67  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.62  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.54  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | OAuth enabled (unverified) | 0.58  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.44  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Datacenter  | OAuth disabled             | 0.58  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.56  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.64  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.67  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.62  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.71  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | OAuth enabled (unverified) | 0.75  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google verified            | 0.67  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| No IP check | Google + GitHub verified   | 0.64  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth disabled             | 0.53  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.52  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Residential | Google + GitHub verified   | 0.49  | CAPTCHA + OAuth | Account Age (0.85, <1 day old), Velocity (0.95, bot-like rate)           |
| Datacenter  | OAuth disabled             | 0.71  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | OAuth enabled (unverified) | 0.74  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google verified            | 0.67  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| Datacenter  | Google + GitHub verified   | 0.64  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, <1 day old)            |
| VPN         | OAuth disabled             | 0.72  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | OAuth enabled (unverified) | 0.76  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google verified            | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| VPN         | Google + GitHub verified   | 0.65  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, <1 day old)             |
| Tor         | OAuth disabled             | 0.79  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | OAuth enabled (unverified) | 0.82  | Auto-rejected   | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google verified            | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |
| Tor         | Google + GitHub verified   | 0.71  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, <1 day old)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.85  | <1 day old     | 18.4%    | 0.16         |
| Karma Score         | 0.60  | no data        | 15.8%    | 0.09         |
| Content/Title Risk  | 0.20  | unique content | 18.4%    | 0.04         |
| URL/Link Risk       | 0.20  | no URLs        | 15.8%    | 0.03         |
| Velocity            | 0.95  | bot-like rate  | 13.2%    | 0.13         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | -     | no bans        | 0%       | (skipped)    |
| ModQueue Rejection  | 0.50  | no data        | 7.9%     | 0.04         |
| Removal Rate        | 0.50  | no data        | 10.5%    | 0.05         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.54**     |

**Outcome:** CAPTCHA + OAuth — Score 0.54 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 7: Serial Offender

A known bad actor with 3+ bans, negative karma, and moderate spam history.

**Example Publication:**

```
link: "https://192.168.1.100/download.exe"
title: "FREE SOFTWARE DOWNLOAD NOW"
content: "CLICK HERE NOW!!! DON'T MISS OUT!!!"
```

**Author Profile:**

| Attribute          | Value    | Risk Implication       |
| ------------------ | -------- | ---------------------- |
| Account Age        | 90 days  | Low risk (established) |
| Karma              | -5       | High risk (negative)   |
| Bans               | 3        | High risk              |
| Velocity           | elevated | Moderate risk          |
| Content Duplicates | 3        | Moderate risk          |
| URL Spam           | 1 unique | Low risk (single URL)  |
| ModQueue Rejection | 80%      | High risk              |
| Removal Rate       | 60%      | High risk              |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                  |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.53  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google + GitHub verified   | 0.53  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Karma Score (0.90, negative karma) |
| Residential | Google verified            | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Datacenter  | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)      |
| Datacenter  | Google verified            | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | Google + GitHub verified   | 0.56  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| VPN         | OAuth disabled             | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)       |
| VPN         | Google verified            | 0.56  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | Google + GitHub verified   | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| Tor         | OAuth disabled             | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | OAuth enabled (unverified) | 0.66  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)      |
| Tor         | Google verified            | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                  |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.53  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google verified            | 0.52  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth disabled             | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Karma Score (0.90, negative karma) |
| Residential | Google verified            | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Datacenter  | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)      |
| Datacenter  | Google verified            | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | Google + GitHub verified   | 0.53  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| VPN         | OAuth disabled             | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | OAuth enabled (unverified) | 0.62  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)       |
| VPN         | Google verified            | 0.56  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| Tor         | OAuth disabled             | 0.63  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | OAuth enabled (unverified) | 0.66  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)      |
| Tor         | Google verified            | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | Google + GitHub verified   | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                  |
| ----------- | -------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.62  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | OAuth enabled (unverified) | 0.66  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google verified            | 0.59  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| No IP check | Google + GitHub verified   | 0.56  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth disabled             | 0.49  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Karma Score (0.90, negative karma) |
| Residential | Google verified            | 0.48  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Residential | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | Karma Score (0.90, negative karma), Ban History (0.85, 3 bans)               |
| Datacenter  | OAuth disabled             | 0.64  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | OAuth enabled (unverified) | 0.68  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)      |
| Datacenter  | Google verified            | 0.62  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| Datacenter  | Google + GitHub verified   | 0.59  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Karma Score (0.90, negative karma)            |
| VPN         | OAuth disabled             | 0.66  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | OAuth enabled (unverified) | 0.69  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)       |
| VPN         | Google verified            | 0.63  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| VPN         | Google + GitHub verified   | 0.60  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.90, negative karma)             |
| Tor         | OAuth disabled             | 0.72  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | OAuth enabled (unverified) | 0.75  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)      |
| Tor         | Google verified            | 0.68  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |
| Tor         | Google + GitHub verified   | 0.66  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.90, negative karma)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.20  | 90+ days       | 16.3%    | 0.03         |
| Karma Score         | 0.90  | negative karma | 14.0%    | 0.13         |
| Content/Title Risk  | 0.45  | 3 duplicates   | 16.3%    | 0.07         |
| URL/Link Risk       | 0.20  | 1 unique URL   | 14.0%    | 0.03         |
| Velocity            | 0.40  | elevated rate  | 11.6%    | 0.05         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.85  | 3 bans         | 11.6%    | 0.10         |
| ModQueue Rejection  | 0.90  | 80% rejected   | 7.0%     | 0.06         |
| Removal Rate        | 0.70  | 60% removed    | 9.3%     | 0.07         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.53**     |

**Outcome:** CAPTCHA + OAuth — Score 0.53 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 8: New User, Dual OAuth

A brand new user verified via both Google and GitHub OAuth.

**Example Publication:**

```
title: "Excited to join the community!"
content: "Hi all, I'm a developer interested in decentralized platforms. Verified my accounts to show I'm legit!"
```

**Author Profile:**

| Attribute          | Value          | Risk Implication        |
| ------------------ | -------------- | ----------------------- |
| Account Age        | no history     | High risk (no history)  |
| Karma              | no data        | Unknown (neutral)       |
| Bans               | 0              | Skipped (no history)    |
| Velocity           | normal         | No risk                 |
| Content Duplicates | none           | Low risk (unique)       |
| URL Spam           | no urls        | Low risk                |
| ModQueue Rejection | No data        | Unknown (neutral)       |
| Removal Rate       | No data        | Unknown (neutral)       |
| OAuth Verification | google, github | Reduced risk (verified) |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                   |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.43  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | OAuth enabled (unverified) | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google verified            | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth disabled             | 0.36  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth enabled (unverified) | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google verified            | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Datacenter  | OAuth disabled             | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| VPN         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google verified            | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| Tor         | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google verified            | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                   |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.43  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | OAuth enabled (unverified) | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google verified            | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google + GitHub verified   | 0.40  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth disabled             | 0.36  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth enabled (unverified) | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google verified            | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Datacenter  | OAuth disabled             | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google + GitHub verified   | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| VPN         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google verified            | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| Tor         | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google verified            | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google + GitHub verified   | 0.52  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                   |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.54  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google verified            | 0.49  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| No IP check | Google + GitHub verified   | 0.49  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth disabled             | 0.42  | CAPTCHA + OAuth | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | OAuth enabled (unverified) | 0.38  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google verified            | 0.38  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Residential | Google + GitHub verified   | 0.38  | CAPTCHA only    | Account Age (0.85, no history), Karma Score (0.60, no data)   |
| Datacenter  | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google verified            | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| Datacenter  | Google + GitHub verified   | 0.54  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.85, no history) |
| VPN         | OAuth disabled             | 0.61  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google verified            | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| VPN         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.85, no history)  |
| Tor         | OAuth disabled             | 0.67  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google verified            | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.85, no history) |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.85  | no history     | 18.4%    | 0.16         |
| Karma Score         | 0.60  | no data        | 15.8%    | 0.09         |
| Content/Title Risk  | 0.20  | unique content | 18.4%    | 0.04         |
| URL/Link Risk       | 0.20  | no URLs        | 15.8%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 13.2%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | -     | no bans        | 0%       | (skipped)    |
| ModQueue Rejection  | 0.50  | no data        | 7.9%     | 0.04         |
| Removal Rate        | 0.50  | no data        | 10.5%    | 0.05         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.43**     |

**Outcome:** CAPTCHA + OAuth — Score 0.43 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 9: Vote Spammer

A user with bot-like voting velocity.

**Example Publication:**

```
vote: +1
commentCid: "QmTargetComment123..."
# (vote: +1 on target comment - 110th vote in the last hour)
```

**Author Profile:**

| Attribute          | Value    | Risk Implication          |
| ------------------ | -------- | ------------------------- |
| Account Age        | 7 days   | Moderate risk             |
| Karma              | 0        | Neutral                   |
| Bans               | 0        | Low risk (clean record)   |
| Velocity           | bot_like | Very high risk (bot-like) |
| Content Duplicates | none     | Low risk (unique)         |
| URL Spam           | no urls  | Low risk                  |
| ModQueue Rejection | No data  | Unknown (neutral)         |
| Removal Rate       | No data  | Unknown (neutral)         |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.38  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | OAuth enabled (unverified) | 0.43  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.38  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.36  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.33  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | OAuth enabled (unverified) | 0.39  | CAPTCHA only    | Social Verification (1.00, not verified), Velocity (0.95, bot-like rate) |
| Residential | Google verified            | 0.33  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | Google + GitHub verified   | 0.31  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth disabled             | 0.44  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)  |
| Datacenter  | Google verified            | 0.44  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| VPN         | OAuth disabled             | 0.46  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)   |
| VPN         | Google verified            | 0.45  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| Tor         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)  |
| Tor         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.38  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | OAuth enabled (unverified) | 0.43  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.38  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.36  | CAPTCHA only    | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.33  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | OAuth enabled (unverified) | 0.39  | CAPTCHA only    | Social Verification (1.00, not verified), Velocity (0.95, bot-like rate) |
| Residential | Google verified            | 0.33  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | Google + GitHub verified   | 0.31  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth disabled             | 0.44  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)  |
| Datacenter  | Google verified            | 0.44  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| VPN         | OAuth disabled             | 0.46  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)   |
| VPN         | Google verified            | 0.45  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| Tor         | OAuth disabled             | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)  |
| Tor         | Google verified            | 0.49  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | Google + GitHub verified   | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.46  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.45  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.42  | CAPTCHA + OAuth | Velocity (0.95, bot-like rate), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.37  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | OAuth enabled (unverified) | 0.44  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Velocity (0.95, bot-like rate) |
| Residential | Google verified            | 0.37  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Residential | Google + GitHub verified   | 0.34  | CAPTCHA only    | Velocity (0.95, bot-like rate), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth disabled             | 0.52  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)  |
| Datacenter  | Google verified            | 0.51  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| Datacenter  | Google + GitHub verified   | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Velocity (0.95, bot-like rate)            |
| VPN         | OAuth disabled             | 0.53  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | OAuth enabled (unverified) | 0.58  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)   |
| VPN         | Google verified            | 0.52  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| VPN         | Google + GitHub verified   | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Velocity (0.95, bot-like rate)             |
| Tor         | OAuth disabled             | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | OAuth enabled (unverified) | 0.64  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)  |
| Tor         | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |
| Tor         | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Velocity (0.95, bot-like rate)            |

### Detailed Factor Breakdown

Configuration: **Vote** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.50  | ~7 days        | 23.3%    | 0.12         |
| Karma Score         | 0.60  | neutral        | 20.0%    | 0.12         |
| Content/Title Risk  | -     | unique content | 0%       | (skipped)    |
| URL/Link Risk       | -     | no URLs        | 0%       | (skipped)    |
| Velocity            | 0.95  | bot-like rate  | 16.7%    | 0.16         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 16.7%    | 0.00         |
| ModQueue Rejection  | 0.50  | no data        | 10.0%    | 0.05         |
| Removal Rate        | 0.10  | no data        | 13.3%    | 0.01         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.46**     |

**Outcome:** CAPTCHA + OAuth — Score 0.46 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 10: Trusted Reply Author

An established user making a reply with positive karma.

**Example Publication:**

```
content: "Great question! Based on my experience over the past year, I'd recommend checking out the documentation first..."
parentCid: "QmParentComment..."
```

**Author Profile:**

| Attribute          | Value     | Risk Implication        |
| ------------------ | --------- | ----------------------- |
| Account Age        | 365+ days | Low risk (established)  |
| Karma              | +3        | Low risk (positive)     |
| Bans               | 0         | Low risk (clean record) |
| Velocity           | normal    | No risk                 |
| Content Duplicates | none      | Low risk (unique)       |
| URL Spam           | no urls   | Low risk                |
| ModQueue Rejection | 0%        | Low risk                |
| Removal Rate       | 0%        | Low risk                |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                            |
| ----------- | -------------------------- | ----- | ------------- | -------------------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.13  | Auto-accepted | Content/Title Risk (0.20, unique content), Karma Score (0.20, positive (+3))           |
| No IP check | OAuth enabled (unverified) | 0.21  | CAPTCHA only  | Social Verification (1.00, not verified), Content/Title Risk (0.20, unique content)    |
| No IP check | Google verified            | 0.16  | Auto-accepted | Social Verification (0.40, Google verified), Content/Title Risk (0.20, unique content) |
| No IP check | Google + GitHub verified   | 0.13  | Auto-accepted | Content/Title Risk (0.20, unique content), Karma Score (0.20, positive (+3))           |
| Residential | OAuth disabled             | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content)              |
| Residential | OAuth enabled (unverified) | 0.22  | CAPTCHA only  | Social Verification (1.00, not verified), IP Risk (0.20, residential IP)               |
| Residential | Google verified            | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, Google verified)            |
| Residential | Google + GitHub verified   | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content)              |
| Datacenter  | OAuth disabled             | 0.26  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)               |
| Datacenter  | OAuth enabled (unverified) | 0.33  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)                |
| Datacenter  | Google verified            | 0.27  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, Google verified)             |
| Datacenter  | Google + GitHub verified   | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)               |
| VPN         | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)                |
| VPN         | OAuth enabled (unverified) | 0.34  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)                 |
| VPN         | Google verified            | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, Google verified)              |
| VPN         | Google + GitHub verified   | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)                |
| Tor         | OAuth disabled             | 0.32  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)               |
| Tor         | OAuth enabled (unverified) | 0.38  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)                |
| Tor         | Google verified            | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, Google verified)             |
| Tor         | Google + GitHub verified   | 0.31  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)               |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                            |
| ----------- | -------------------------- | ----- | ------------- | -------------------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.13  | Auto-accepted | Content/Title Risk (0.20, unique content), Karma Score (0.20, positive (+3))           |
| No IP check | OAuth enabled (unverified) | 0.21  | CAPTCHA only  | Social Verification (1.00, not verified), Content/Title Risk (0.20, unique content)    |
| No IP check | Google verified            | 0.16  | Auto-accepted | Social Verification (0.40, Google verified), Content/Title Risk (0.20, unique content) |
| No IP check | Google + GitHub verified   | 0.13  | Auto-accepted | Content/Title Risk (0.20, unique content), Karma Score (0.20, positive (+3))           |
| Residential | OAuth disabled             | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content)              |
| Residential | OAuth enabled (unverified) | 0.22  | CAPTCHA only  | Social Verification (1.00, not verified), IP Risk (0.20, residential IP)               |
| Residential | Google verified            | 0.17  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.40, Google verified)            |
| Residential | Google + GitHub verified   | 0.15  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content)              |
| Datacenter  | OAuth disabled             | 0.26  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)               |
| Datacenter  | OAuth enabled (unverified) | 0.33  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)                |
| Datacenter  | Google verified            | 0.27  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.40, Google verified)             |
| Datacenter  | Google + GitHub verified   | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)               |
| VPN         | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)                |
| VPN         | OAuth enabled (unverified) | 0.34  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)                 |
| VPN         | Google verified            | 0.29  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.40, Google verified)              |
| VPN         | Google + GitHub verified   | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)                |
| Tor         | OAuth disabled             | 0.32  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)               |
| Tor         | OAuth enabled (unverified) | 0.38  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)                |
| Tor         | Google verified            | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.40, Google verified)             |
| Tor         | Google + GitHub verified   | 0.31  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)               |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                    |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.10  | Auto-accepted   | Karma Score (0.20, positive (+3)), Account Age (0.10, 365+ days)               |
| No IP check | OAuth enabled (unverified) | 0.21  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.20, positive (+3))    |
| No IP check | Google verified            | 0.14  | Auto-accepted   | Social Verification (0.40, Google verified), Karma Score (0.20, positive (+3)) |
| No IP check | Google + GitHub verified   | 0.11  | Auto-accepted   | Karma Score (0.20, positive (+3)), Account Age (0.10, 365+ days)               |
| Residential | OAuth disabled             | 0.13  | Auto-accepted   | IP Risk (0.20, residential IP), Karma Score (0.20, positive (+3))              |
| Residential | OAuth enabled (unverified) | 0.22  | CAPTCHA only    | Social Verification (1.00, not verified), IP Risk (0.20, residential IP)       |
| Residential | Google verified            | 0.16  | Auto-accepted   | IP Risk (0.20, residential IP), Social Verification (0.40, Google verified)    |
| Residential | Google + GitHub verified   | 0.13  | Auto-accepted   | IP Risk (0.20, residential IP), Karma Score (0.20, positive (+3))              |
| Datacenter  | OAuth disabled             | 0.28  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.20, positive (+3))               |
| Datacenter  | OAuth enabled (unverified) | 0.36  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)        |
| Datacenter  | Google verified            | 0.29  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Social Verification (0.40, Google verified)     |
| Datacenter  | Google + GitHub verified   | 0.27  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.20, positive (+3))               |
| VPN         | OAuth disabled             | 0.30  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.20, positive (+3))                |
| VPN         | OAuth enabled (unverified) | 0.37  | CAPTCHA only    | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)         |
| VPN         | Google verified            | 0.31  | CAPTCHA only    | IP Risk (0.75, VPN detected), Social Verification (0.40, Google verified)      |
| VPN         | Google + GitHub verified   | 0.28  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.20, positive (+3))                |
| Tor         | OAuth disabled             | 0.36  | CAPTCHA only    | IP Risk (0.95, Tor exit node), Karma Score (0.20, positive (+3))               |
| Tor         | OAuth enabled (unverified) | 0.43  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)        |
| Tor         | Google verified            | 0.36  | CAPTCHA only    | IP Risk (0.95, Tor exit node), Social Verification (0.40, Google verified)     |
| Tor         | Google + GitHub verified   | 0.34  | CAPTCHA only    | IP Risk (0.95, Tor exit node), Karma Score (0.20, positive (+3))               |

### Detailed Factor Breakdown

Configuration: **Reply** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.10  | 365+ days      | 16.3%    | 0.02         |
| Karma Score         | 0.20  | positive (+3)  | 14.0%    | 0.03         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.6%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.10  | 0% rejected    | 7.0%     | 0.01         |
| Removal Rate        | 0.10  | 0% removed     | 9.3%     | 0.01         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.13**     |

**Outcome:** Auto-accepted — Score 0.13 falls in the auto-accept tier (< 0.2), allowing the publication without any challenge.

---

## Scenario 11: Borderline Modqueue

A moderately established user with 50% modqueue rejection rate.

**Example Publication:**

```
title: "Another attempt at posting"
content: "Half of my submissions keep getting rejected, not sure why..."
```

**Author Profile:**

| Attribute          | Value   | Risk Implication        |
| ------------------ | ------- | ----------------------- |
| Account Age        | 30 days | Low-moderate risk       |
| Karma              | 0       | Neutral                 |
| Bans               | 0       | Low risk (clean record) |
| Velocity           | normal  | No risk                 |
| Content Duplicates | none    | Low risk (unique)       |
| URL Spam           | no urls | Low risk                |
| ModQueue Rejection | 50%     | Moderate risk           |
| Removal Rate       | 0%      | Low risk                |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.26  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | OAuth enabled (unverified) | 0.32  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.27  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | Google + GitHub verified   | 0.25  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| Residential | OAuth disabled             | 0.23  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | OAuth enabled (unverified) | 0.30  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| Residential | Google verified            | 0.25  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | Google + GitHub verified   | 0.23  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Datacenter  | OAuth disabled             | 0.35  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth enabled (unverified) | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.35  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | Google + GitHub verified   | 0.33  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| VPN         | OAuth disabled             | 0.36  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | OAuth enabled (unverified) | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.36  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | Google + GitHub verified   | 0.34  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| Tor         | OAuth disabled             | 0.41  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.26  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | OAuth enabled (unverified) | 0.32  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.27  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | Google + GitHub verified   | 0.25  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| Residential | OAuth disabled             | 0.23  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | OAuth enabled (unverified) | 0.30  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| Residential | Google verified            | 0.25  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | Google + GitHub verified   | 0.23  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Datacenter  | OAuth disabled             | 0.35  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth enabled (unverified) | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.35  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | Google + GitHub verified   | 0.33  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| VPN         | OAuth disabled             | 0.36  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | OAuth enabled (unverified) | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.36  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | Google + GitHub verified   | 0.34  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| Tor         | OAuth disabled             | 0.41  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.28  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | OAuth enabled (unverified) | 0.37  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.30  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| No IP check | Google + GitHub verified   | 0.27  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.35, ~30 days)               |
| Residential | OAuth disabled             | 0.24  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | OAuth enabled (unverified) | 0.32  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| Residential | Google verified            | 0.26  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Residential | Google + GitHub verified   | 0.23  | CAPTCHA only    | Karma Score (0.60, neutral), IP Risk (0.20, residential IP)             |
| Datacenter  | OAuth disabled             | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| Datacenter  | Google + GitHub verified   | 0.37  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Karma Score (0.60, neutral)              |
| VPN         | OAuth disabled             | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| VPN         | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.75, VPN detected), Karma Score (0.60, neutral)               |
| Tor         | OAuth disabled             | 0.47  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | OAuth enabled (unverified) | 0.53  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |
| Tor         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Karma Score (0.60, neutral)              |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.35  | ~30 days       | 16.3%    | 0.06         |
| Karma Score         | 0.60  | neutral        | 14.0%    | 0.08         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.6%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.50  | 50% rejected   | 7.0%     | 0.03         |
| Removal Rate        | 0.10  | 0% removed     | 9.3%     | 0.01         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.26**     |

**Outcome:** CAPTCHA only — Score 0.26 falls in the CAPTCHA-only tier (0.2-0.4), requiring a CAPTCHA challenge before publishing.

---

## Scenario 12: High Removal Rate

An established user whose content is frequently removed (60%).

**Example Publication:**

```
title: "Trying again with this post"
content: "Mods keep removing my content but I'm not sure what rules I'm breaking..."
```

**Author Profile:**

| Attribute          | Value   | Risk Implication        |
| ------------------ | ------- | ----------------------- |
| Account Age        | 90 days | Low risk (established)  |
| Karma              | 0       | Neutral                 |
| Bans               | 0       | Low risk (clean record) |
| Velocity           | normal  | No risk                 |
| Content Duplicates | none    | Low risk (unique)       |
| URL Spam           | no urls | Low risk                |
| ModQueue Rejection | No data | Unknown (neutral)       |
| Removal Rate       | 60%     | High risk               |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                |
| ----------- | -------------------------- | ----- | --------------- | -------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.31  | CAPTCHA only    | Karma Score (0.60, neutral), Removal Rate (0.90, 60% removed)              |
| No IP check | OAuth enabled (unverified) | 0.37  | CAPTCHA only    | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| No IP check | Google verified            | 0.31  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.29  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.29  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth enabled (unverified) | 0.35  | CAPTCHA only    | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| Residential | Google verified            | 0.30  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | Google + GitHub verified   | 0.28  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth disabled             | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)    |
| Datacenter  | Google verified            | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| VPN         | OAuth disabled             | 0.42  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)     |
| VPN         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | Google + GitHub verified   | 0.39  | CAPTCHA only    | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| Tor         | OAuth disabled             | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | OAuth enabled (unverified) | 0.51  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)    |
| Tor         | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | Google + GitHub verified   | 0.44  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                |
| ----------- | -------------------------- | ----- | --------------- | -------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.31  | CAPTCHA only    | Karma Score (0.60, neutral), Removal Rate (0.90, 60% removed)              |
| No IP check | OAuth enabled (unverified) | 0.37  | CAPTCHA only    | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| No IP check | Google verified            | 0.31  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.29  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.29  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth enabled (unverified) | 0.35  | CAPTCHA only    | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| Residential | Google verified            | 0.30  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | Google + GitHub verified   | 0.28  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth disabled             | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)    |
| Datacenter  | Google verified            | 0.40  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| VPN         | OAuth disabled             | 0.42  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | OAuth enabled (unverified) | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)     |
| VPN         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | Google + GitHub verified   | 0.39  | CAPTCHA only    | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| Tor         | OAuth disabled             | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | OAuth enabled (unverified) | 0.51  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)    |
| Tor         | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | Google + GitHub verified   | 0.44  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                                |
| ----------- | -------------------------- | ----- | --------------- | -------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.35  | CAPTCHA only    | Karma Score (0.60, neutral), Removal Rate (0.90, 60% removed)              |
| No IP check | OAuth enabled (unverified) | 0.43  | CAPTCHA + OAuth | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| No IP check | Google verified            | 0.36  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| No IP check | Google + GitHub verified   | 0.33  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth disabled             | 0.32  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | OAuth enabled (unverified) | 0.39  | CAPTCHA only    | Social Verification (1.00, not verified), Removal Rate (0.90, 60% removed) |
| Residential | Google verified            | 0.32  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Residential | Google + GitHub verified   | 0.30  | CAPTCHA only    | Removal Rate (0.90, 60% removed), Karma Score (0.60, neutral)              |
| Datacenter  | OAuth disabled             | 0.47  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | OAuth enabled (unverified) | 0.52  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified)    |
| Datacenter  | Google verified            | 0.46  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| Datacenter  | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Removal Rate (0.90, 60% removed)            |
| VPN         | OAuth disabled             | 0.48  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | OAuth enabled (unverified) | 0.54  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)     |
| VPN         | Google verified            | 0.47  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| VPN         | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Removal Rate (0.90, 60% removed)             |
| Tor         | OAuth disabled             | 0.54  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | OAuth enabled (unverified) | 0.59  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified)    |
| Tor         | Google verified            | 0.53  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |
| Tor         | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Removal Rate (0.90, 60% removed)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.20  | 90+ days       | 16.3%    | 0.03         |
| Karma Score         | 0.60  | neutral        | 14.0%    | 0.08         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.6%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.50  | no data        | 7.0%     | 0.03         |
| Removal Rate        | 0.90  | 60% removed    | 9.3%     | 0.08         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.31**     |

**Outcome:** CAPTCHA only — Score 0.31 falls in the CAPTCHA-only tier (0.2-0.4), requiring a CAPTCHA challenge before publishing.

---

## Scenario 13: New, OAuth Unverified

A new user where OAuth is enabled but they haven't verified.

**Example Publication:**

```
title: "New here, skipped the verification"
content: "Decided not to link my social accounts, is that okay?"
```

**Author Profile:**

| Attribute          | Value              | Risk Implication       |
| ------------------ | ------------------ | ---------------------- |
| Account Age        | no history         | High risk (no history) |
| Karma              | no data            | Unknown (neutral)      |
| Bans               | 0                  | Skipped (no history)   |
| Velocity           | normal             | No risk                |
| Content Duplicates | none               | Low risk (unique)      |
| URL Spam           | no urls            | Low risk               |
| ModQueue Rejection | No data            | Unknown (neutral)      |
| Removal Rate       | No data            | Unknown (neutral)      |
| OAuth Verification | None (but enabled) | High risk (unverified) |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| No IP check | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | OAuth disabled             | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| Residential | OAuth enabled (unverified) | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google + GitHub verified   | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Datacenter  | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| VPN         | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google + GitHub verified   | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| Tor         | OAuth disabled             | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| No IP check | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google + GitHub verified   | 0.50  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | OAuth disabled             | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| Residential | OAuth enabled (unverified) | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google + GitHub verified   | 0.44  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Datacenter  | OAuth disabled             | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google + GitHub verified   | 0.55  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| VPN         | OAuth disabled             | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google + GitHub verified   | 0.57  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| Tor         | OAuth disabled             | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google + GitHub verified   | 0.61  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                              |
| ----------- | -------------------------- | ----- | --------------- | ------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.64  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| No IP check | OAuth enabled (unverified) | 0.64  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google verified            | 0.64  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| No IP check | Google + GitHub verified   | 0.64  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | OAuth disabled             | 0.51  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, skipped)      |
| Residential | OAuth enabled (unverified) | 0.51  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google verified            | 0.51  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Residential | Google + GitHub verified   | 0.51  | CAPTCHA + OAuth | Account Age (1.00, no history), Social Verification (1.00, not verified) |
| Datacenter  | OAuth disabled             | 0.66  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | OAuth enabled (unverified) | 0.66  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google verified            | 0.66  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| Datacenter  | Google + GitHub verified   | 0.66  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (1.00, no history)            |
| VPN         | OAuth disabled             | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | OAuth enabled (unverified) | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google verified            | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| VPN         | Google + GitHub verified   | 0.68  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (1.00, no history)             |
| Tor         | OAuth disabled             | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | OAuth enabled (unverified) | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google verified            | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |
| Tor         | Google + GitHub verified   | 0.74  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (1.00, no history)            |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 1.00  | no history     | 16.7%    | 0.17         |
| Karma Score         | 0.60  | no data        | 14.3%    | 0.09         |
| Content/Title Risk  | 0.20  | unique content | 16.7%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.3%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.9%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | -     | no bans        | 0%       | (skipped)    |
| ModQueue Rejection  | 0.50  | no data        | 7.1%     | 0.04         |
| Removal Rate        | 0.50  | no data        | 9.5%     | 0.05         |
| Social Verification | 1.00  | skipped        | 9.5%     | 0.10         |
| **Total**           |       |                | **100%** | **0.50**     |

**Outcome:** CAPTCHA + OAuth — Score 0.50 falls in the CAPTCHA + OAuth tier (0.4-0.8), requiring both CAPTCHA verification and OAuth sign-in.

---

## Scenario 14: Moderate Content Spam

A user with 3 duplicate content posts.

**Example Publication:**

```
title: "Check this out (posted 3 times)"
content: "This is duplicate spam content that appears multiple times."
```

**Author Profile:**

| Attribute          | Value   | Risk Implication        |
| ------------------ | ------- | ----------------------- |
| Account Age        | 7 days  | Moderate risk           |
| Karma              | 0       | Neutral                 |
| Bans               | 0       | Low risk (clean record) |
| Velocity           | normal  | No risk                 |
| Content Duplicates | 3       | Moderate risk           |
| URL Spam           | no urls | Low risk                |
| ModQueue Rejection | No data | Unknown (neutral)       |
| Removal Rate       | No data | Unknown (neutral)       |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.32  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | OAuth enabled (unverified) | 0.38  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.33  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | Google + GitHub verified   | 0.31  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| Residential | OAuth disabled             | 0.28  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | OAuth enabled (unverified) | 0.34  | CAPTCHA only    | Social Verification (1.00, not verified), Account Age (0.50, ~7 days)   |
| Residential | Google verified            | 0.29  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | Google + GitHub verified   | 0.27  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Datacenter  | OAuth disabled             | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth enabled (unverified) | 0.45  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | Google + GitHub verified   | 0.37  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| VPN         | OAuth disabled             | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| Tor         | OAuth disabled             | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.32  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | OAuth enabled (unverified) | 0.38  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.33  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | Google + GitHub verified   | 0.31  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| Residential | OAuth disabled             | 0.28  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | OAuth enabled (unverified) | 0.34  | CAPTCHA only    | Social Verification (1.00, not verified), Account Age (0.50, ~7 days)   |
| Residential | Google verified            | 0.29  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | Google + GitHub verified   | 0.27  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Datacenter  | OAuth disabled             | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth enabled (unverified) | 0.45  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | Google + GitHub verified   | 0.37  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| VPN         | OAuth disabled             | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | OAuth enabled (unverified) | 0.46  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | Google + GitHub verified   | 0.38  | CAPTCHA only    | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| Tor         | OAuth disabled             | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | OAuth enabled (unverified) | 0.50  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | Google + GitHub verified   | 0.43  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome         | Top Factors                                                             |
| ----------- | -------------------------- | ----- | --------------- | ----------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.32  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | OAuth enabled (unverified) | 0.40  | CAPTCHA only    | Social Verification (1.00, not verified), Karma Score (0.60, neutral)   |
| No IP check | Google verified            | 0.33  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| No IP check | Google + GitHub verified   | 0.30  | CAPTCHA only    | Karma Score (0.60, neutral), Account Age (0.50, ~7 days)                |
| Residential | OAuth disabled             | 0.26  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | OAuth enabled (unverified) | 0.34  | CAPTCHA only    | Social Verification (1.00, not verified), Account Age (0.50, ~7 days)   |
| Residential | Google verified            | 0.28  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Residential | Google + GitHub verified   | 0.25  | CAPTCHA only    | Account Age (0.50, ~7 days), Karma Score (0.60, neutral)                |
| Datacenter  | OAuth disabled             | 0.42  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | OAuth enabled (unverified) | 0.48  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Social Verification (1.00, not verified) |
| Datacenter  | Google verified            | 0.41  | CAPTCHA + OAuth | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| Datacenter  | Google + GitHub verified   | 0.39  | CAPTCHA only    | IP Risk (0.70, datacenter IP), Account Age (0.50, ~7 days)              |
| VPN         | OAuth disabled             | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | OAuth enabled (unverified) | 0.49  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Social Verification (1.00, not verified)  |
| VPN         | Google verified            | 0.43  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| VPN         | Google + GitHub verified   | 0.40  | CAPTCHA + OAuth | IP Risk (0.75, VPN detected), Account Age (0.50, ~7 days)               |
| Tor         | OAuth disabled             | 0.49  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | OAuth enabled (unverified) | 0.55  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Social Verification (1.00, not verified) |
| Tor         | Google verified            | 0.48  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |
| Tor         | Google + GitHub verified   | 0.45  | CAPTCHA + OAuth | IP Risk (0.95, Tor exit node), Account Age (0.50, ~7 days)              |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description  | Weight   | Contribution |
| ------------------- | ----- | ------------ | -------- | ------------ |
| Account Age         | 0.50  | ~7 days      | 16.3%    | 0.08         |
| Karma Score         | 0.60  | neutral      | 14.0%    | 0.08         |
| Content/Title Risk  | 0.45  | 3 duplicates | 16.3%    | 0.07         |
| URL/Link Risk       | 0.20  | no URLs      | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate  | 11.6%    | 0.01         |
| IP Risk             | -     | skipped      | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans      | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.50  | no data      | 7.0%     | 0.03         |
| Removal Rate        | 0.10  | no data      | 9.3%     | 0.01         |
| Social Verification | -     | skipped      | 0%       | (skipped)    |
| **Total**           |       |              | **100%** | **0.32**     |

**Outcome:** CAPTCHA only — Score 0.32 falls in the CAPTCHA-only tier (0.2-0.4), requiring a CAPTCHA challenge before publishing.

---

## Scenario 15: Perfect User

An ideal user with 365+ days history, +5 karma, dual OAuth, and clean record.

**Example Publication:**

```
title: "Comprehensive guide to running your own subplebbit"
content: "After over a year on the platform, I've compiled everything I've learned..."
```

**Author Profile:**

| Attribute          | Value          | Risk Implication        |
| ------------------ | -------------- | ----------------------- |
| Account Age        | 365+ days      | Low risk (established)  |
| Karma              | +5             | Low risk (positive)     |
| Bans               | 0              | Low risk (clean record) |
| Velocity           | normal         | No risk                 |
| Content Duplicates | none           | Low risk (unique)       |
| URL Spam           | no urls        | Low risk                |
| ModQueue Rejection | 0%             | Low risk                |
| Removal Rate       | 0%             | Low risk                |
| OAuth Verification | google, github | Reduced risk (verified) |

### Results by Configuration

#### Posts

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                               |
| ----------- | -------------------------- | ----- | ------------- | ------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | OAuth enabled (unverified) | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | Google verified            | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | Google + GitHub verified   | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| Residential | OAuth disabled             | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | OAuth enabled (unverified) | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | Google verified            | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | Google + GitHub verified   | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Datacenter  | OAuth disabled             | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | OAuth enabled (unverified) | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | Google verified            | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | Google + GitHub verified   | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| VPN         | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | OAuth enabled (unverified) | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | Google verified            | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | Google + GitHub verified   | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| Tor         | OAuth disabled             | 0.31  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | OAuth enabled (unverified) | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | Google verified            | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | Google + GitHub verified   | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |

#### Replies

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                               |
| ----------- | -------------------------- | ----- | ------------- | ------------------------------------------------------------------------- |
| No IP check | OAuth disabled             | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | OAuth enabled (unverified) | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | Google verified            | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| No IP check | Google + GitHub verified   | 0.12  | Auto-accepted | Content/Title Risk (0.20, unique content), URL/Link Risk (0.20, no URLs)  |
| Residential | OAuth disabled             | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | OAuth enabled (unverified) | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | Google verified            | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Residential | Google + GitHub verified   | 0.14  | Auto-accepted | IP Risk (0.20, residential IP), Content/Title Risk (0.20, unique content) |
| Datacenter  | OAuth disabled             | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | OAuth enabled (unverified) | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | Google verified            | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| Datacenter  | Google + GitHub verified   | 0.25  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Content/Title Risk (0.20, unique content)  |
| VPN         | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | OAuth enabled (unverified) | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | Google verified            | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| VPN         | Google + GitHub verified   | 0.26  | CAPTCHA only  | IP Risk (0.75, VPN detected), Content/Title Risk (0.20, unique content)   |
| Tor         | OAuth disabled             | 0.31  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | OAuth enabled (unverified) | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | Google verified            | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |
| Tor         | Google + GitHub verified   | 0.30  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Content/Title Risk (0.20, unique content)  |

#### Votes

| IP Type     | OAuth Config               | Score | Outcome       | Top Factors                                                                          |
| ----------- | -------------------------- | ----- | ------------- | ------------------------------------------------------------------------------------ |
| No IP check | OAuth disabled             | 0.08  | Auto-accepted | Account Age (0.10, 365+ days), Karma Score (0.10, positive (+5))                     |
| No IP check | OAuth enabled (unverified) | 0.09  | Auto-accepted | Account Age (0.10, 365+ days), Social Verification (0.16, google + github verified)  |
| No IP check | Google verified            | 0.09  | Auto-accepted | Account Age (0.10, 365+ days), Social Verification (0.16, google + github verified)  |
| No IP check | Google + GitHub verified   | 0.09  | Auto-accepted | Account Age (0.10, 365+ days), Social Verification (0.16, google + github verified)  |
| Residential | OAuth disabled             | 0.12  | Auto-accepted | IP Risk (0.20, residential IP), Account Age (0.10, 365+ days)                        |
| Residential | OAuth enabled (unverified) | 0.12  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.16, google + github verified) |
| Residential | Google verified            | 0.12  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.16, google + github verified) |
| Residential | Google + GitHub verified   | 0.12  | Auto-accepted | IP Risk (0.20, residential IP), Social Verification (0.16, google + github verified) |
| Datacenter  | OAuth disabled             | 0.27  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Account Age (0.10, 365+ days)                         |
| Datacenter  | OAuth enabled (unverified) | 0.26  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.16, google + github verified)  |
| Datacenter  | Google verified            | 0.26  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.16, google + github verified)  |
| Datacenter  | Google + GitHub verified   | 0.26  | CAPTCHA only  | IP Risk (0.70, datacenter IP), Social Verification (0.16, google + github verified)  |
| VPN         | OAuth disabled             | 0.28  | CAPTCHA only  | IP Risk (0.75, VPN detected), Account Age (0.10, 365+ days)                          |
| VPN         | OAuth enabled (unverified) | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.16, google + github verified)   |
| VPN         | Google verified            | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.16, google + github verified)   |
| VPN         | Google + GitHub verified   | 0.27  | CAPTCHA only  | IP Risk (0.75, VPN detected), Social Verification (0.16, google + github verified)   |
| Tor         | OAuth disabled             | 0.35  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Account Age (0.10, 365+ days)                         |
| Tor         | OAuth enabled (unverified) | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.16, google + github verified)  |
| Tor         | Google verified            | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.16, google + github verified)  |
| Tor         | Google + GitHub verified   | 0.33  | CAPTCHA only  | IP Risk (0.95, Tor exit node), Social Verification (0.16, google + github verified)  |

### Detailed Factor Breakdown

Configuration: **Post** / **No IP check** / **OAuth disabled**

| Factor              | Score | Description    | Weight   | Contribution |
| ------------------- | ----- | -------------- | -------- | ------------ |
| Account Age         | 0.10  | 365+ days      | 16.3%    | 0.02         |
| Karma Score         | 0.10  | positive (+5)  | 14.0%    | 0.01         |
| Content/Title Risk  | 0.20  | unique content | 16.3%    | 0.03         |
| URL/Link Risk       | 0.20  | no URLs        | 14.0%    | 0.03         |
| Velocity            | 0.10  | normal rate    | 11.6%    | 0.01         |
| IP Risk             | -     | skipped        | 0%       | (skipped)    |
| Ban History         | 0.00  | no bans        | 11.6%    | 0.00         |
| ModQueue Rejection  | 0.10  | 0% rejected    | 7.0%     | 0.01         |
| Removal Rate        | 0.10  | 0% removed     | 9.3%     | 0.01         |
| Social Verification | -     | skipped        | 0%       | (skipped)    |
| **Total**           |       |                | **100%** | **0.12**     |

**Outcome:** Auto-accepted — Score 0.12 falls in the auto-accept tier (< 0.2), allowing the publication without any challenge.

---

## Summary

Overview of risk score ranges and outcomes for each scenario:

| #   | Scenario                 | Min Score | Max Score | Possible Outcomes                            |
| --- | ------------------------ | --------- | --------- | -------------------------------------------- |
| 1   | Brand New User           | 0.34      | 0.74      | CAPTCHA + OAuth, CAPTCHA only                |
| 2   | Established Trusted User | 0.11      | 0.36      | Auto-accepted, CAPTCHA only                  |
| 3   | New User with Link       | 0.34      | 0.71      | CAPTCHA + OAuth, CAPTCHA only                |
| 4   | Repeat Link Spammer      | 0.40      | 0.70      | CAPTCHA + OAuth                              |
| 5   | Content Duplicator       | 0.26      | 0.56      | CAPTCHA only, CAPTCHA + OAuth                |
| 6   | Bot-like Velocity        | 0.42      | 0.82      | CAPTCHA + OAuth, Auto-rejected               |
| 7   | Serial Offender          | 0.43      | 0.75      | CAPTCHA + OAuth                              |
| 8   | New User, Dual OAuth     | 0.34      | 0.67      | CAPTCHA + OAuth, CAPTCHA only                |
| 9   | Vote Spammer             | 0.31      | 0.64      | CAPTCHA only, CAPTCHA + OAuth                |
| 10  | Trusted Reply Author     | 0.10      | 0.43      | Auto-accepted, CAPTCHA only, CAPTCHA + OAuth |
| 11  | Borderline Modqueue      | 0.23      | 0.53      | CAPTCHA only, CAPTCHA + OAuth                |
| 12  | High Removal Rate        | 0.28      | 0.59      | CAPTCHA only, CAPTCHA + OAuth                |
| 13  | New, OAuth Unverified    | 0.44      | 0.74      | CAPTCHA + OAuth                              |
| 14  | Moderate Content Spam    | 0.25      | 0.55      | CAPTCHA only, CAPTCHA + OAuth                |
| 15  | Perfect User             | 0.08      | 0.35      | Auto-accepted, CAPTCHA only                  |

---

_This document is auto-generated. Run `npm run generate-scenarios` to regenerate._
