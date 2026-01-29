# Risk Score Scenarios

Generated: 2026-01-29

This document shows risk scores across different configuration combinations for various user scenarios.
Each scenario is tested against all combinations of:

- **IP Types**: disabled (no IP check), residential, datacenter, vpn, tor
- **OAuth Configs**: disabled, enabled-unverified, google-verified, google+github-verified
- **Publication Types**: post, reply, vote

**Total: 5 x 4 x 3 = 60 configurations per scenario**

---

## Scenario 1: Brand New User

**Description:** A completely new user making their first post with no history.

**Author State:**

- Account Age: no history
- Karma: no data
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                     |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | --------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.40       | captcha_and_oauth | accountAge (1.00), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | google-verified        | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | residential | disabled               | 0.34       | captcha_only      | accountAge (1.00), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | enabled-unverified     | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | google-verified        | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | datacenter  | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), karmaScore (0.60)             |
| post     | datacenter  | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| post     | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), karmaScore (0.60)             |
| post     | vpn         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| post     | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), karmaScore (0.60)             |
| post     | tor         | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| post     | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | disabled    | disabled               | 0.40       | captcha_and_oauth | accountAge (1.00), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | google-verified        | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | residential | disabled               | 0.34       | captcha_only      | accountAge (1.00), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | enabled-unverified     | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | google-verified        | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | datacenter  | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), karmaScore (0.60)             |
| reply    | datacenter  | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| reply    | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), karmaScore (0.60)             |
| reply    | vpn         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| reply    | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), karmaScore (0.60)             |
| reply    | tor         | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| reply    | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | disabled    | disabled               | 0.49       | captcha_and_oauth | accountAge (1.00), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | enabled-unverified     | 0.55       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | google-verified        | 0.45       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | google+github-verified | 0.42       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | residential | disabled               | 0.39       | captcha_only      | accountAge (1.00), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | google-verified        | 0.37       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | google+github-verified | 0.34       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | datacenter  | disabled               | 0.54       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), karmaScore (0.60)             |
| vote     | datacenter  | enabled-unverified     | 0.59       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| vote     | datacenter  | google-verified        | 0.50       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | google+github-verified | 0.48       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | disabled               | 0.55       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), karmaScore (0.60)             |
| vote     | vpn         | enabled-unverified     | 0.60       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| vote     | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | disabled               | 0.62       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), karmaScore (0.60)             |
| vote     | tor         | enabled-unverified     | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| vote     | tor         | google-verified        | 0.57       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 1.00  | 14.0%       | 16.3%      | 0.16         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 9.3%       | 0.05         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.40**     |

---

## Scenario 2: Established Trusted User

**Description:** A well-established user with 90+ days history, positive karma, and Google verification.

**Author State:**

- Account Age: 90 days
- Karma: +5
- Bans: 0
- Velocity: normal
- Modqueue Rejection: 0%
- Removal Rate: 0%
- Content Duplicates: none
- URL Spam: no urls
- OAuth Verification: google

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier         | Top Factors                                                                  |
| -------- | ----------- | ---------------------- | ---------- | ------------ | ---------------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.13       | auto_accept  | accountAge (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | disabled    | enabled-unverified     | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| post     | disabled    | google-verified        | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| post     | disabled    | google+github-verified | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| post     | residential | disabled               | 0.15       | auto_accept  | ipRisk (0.20), accountAge (0.20), commentContentTitleRisk (0.20)             |
| post     | residential | enabled-unverified     | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| post     | residential | google-verified        | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| post     | residential | google+github-verified | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| post     | datacenter  | disabled               | 0.27       | captcha_only | ipRisk (0.70), accountAge (0.20), commentContentTitleRisk (0.20)             |
| post     | datacenter  | enabled-unverified     | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| post     | datacenter  | google-verified        | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| post     | datacenter  | google+github-verified | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| post     | vpn         | disabled               | 0.28       | captcha_only | ipRisk (0.75), accountAge (0.20), commentContentTitleRisk (0.20)             |
| post     | vpn         | enabled-unverified     | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| post     | vpn         | google-verified        | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| post     | vpn         | google+github-verified | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| post     | tor         | disabled               | 0.32       | captcha_only | ipRisk (0.95), accountAge (0.20), commentContentTitleRisk (0.20)             |
| post     | tor         | enabled-unverified     | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| post     | tor         | google-verified        | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| post     | tor         | google+github-verified | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| reply    | disabled    | disabled               | 0.13       | auto_accept  | accountAge (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | disabled    | enabled-unverified     | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| reply    | disabled    | google-verified        | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| reply    | disabled    | google+github-verified | 0.16       | auto_accept  | socialVerification (0.40), accountAge (0.20), commentContentTitleRisk (0.20) |
| reply    | residential | disabled               | 0.15       | auto_accept  | ipRisk (0.20), accountAge (0.20), commentContentTitleRisk (0.20)             |
| reply    | residential | enabled-unverified     | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| reply    | residential | google-verified        | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| reply    | residential | google+github-verified | 0.17       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| reply    | datacenter  | disabled               | 0.27       | captcha_only | ipRisk (0.70), accountAge (0.20), commentContentTitleRisk (0.20)             |
| reply    | datacenter  | enabled-unverified     | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| reply    | datacenter  | google-verified        | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| reply    | datacenter  | google+github-verified | 0.28       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| reply    | vpn         | disabled               | 0.28       | captcha_only | ipRisk (0.75), accountAge (0.20), commentContentTitleRisk (0.20)             |
| reply    | vpn         | enabled-unverified     | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| reply    | vpn         | google-verified        | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| reply    | vpn         | google+github-verified | 0.29       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| reply    | tor         | disabled               | 0.32       | captcha_only | ipRisk (0.95), accountAge (0.20), commentContentTitleRisk (0.20)             |
| reply    | tor         | enabled-unverified     | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| reply    | tor         | google-verified        | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| reply    | tor         | google+github-verified | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| vote     | disabled    | disabled               | 0.11       | auto_accept  | accountAge (0.20), karmaScore (0.10), velocityRisk (0.10)                    |
| vote     | disabled    | enabled-unverified     | 0.14       | auto_accept  | socialVerification (0.40), accountAge (0.20), karmaScore (0.10)              |
| vote     | disabled    | google-verified        | 0.14       | auto_accept  | socialVerification (0.40), accountAge (0.20), karmaScore (0.10)              |
| vote     | disabled    | google+github-verified | 0.14       | auto_accept  | socialVerification (0.40), accountAge (0.20), karmaScore (0.10)              |
| vote     | residential | disabled               | 0.13       | auto_accept  | ipRisk (0.20), accountAge (0.20), karmaScore (0.10)                          |
| vote     | residential | enabled-unverified     | 0.16       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| vote     | residential | google-verified        | 0.16       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| vote     | residential | google+github-verified | 0.16       | auto_accept  | ipRisk (0.20), socialVerification (0.40), accountAge (0.20)                  |
| vote     | datacenter  | disabled               | 0.28       | captcha_only | ipRisk (0.70), accountAge (0.20), karmaScore (0.10)                          |
| vote     | datacenter  | enabled-unverified     | 0.30       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| vote     | datacenter  | google-verified        | 0.30       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| vote     | datacenter  | google+github-verified | 0.30       | captcha_only | ipRisk (0.70), socialVerification (0.40), accountAge (0.20)                  |
| vote     | vpn         | disabled               | 0.30       | captcha_only | ipRisk (0.75), accountAge (0.20), karmaScore (0.10)                          |
| vote     | vpn         | enabled-unverified     | 0.31       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| vote     | vpn         | google-verified        | 0.31       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| vote     | vpn         | google+github-verified | 0.31       | captcha_only | ipRisk (0.75), socialVerification (0.40), accountAge (0.20)                  |
| vote     | tor         | disabled               | 0.36       | captcha_only | ipRisk (0.95), accountAge (0.20), karmaScore (0.10)                          |
| vote     | tor         | enabled-unverified     | 0.36       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| vote     | tor         | google-verified        | 0.36       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |
| vote     | tor         | google+github-verified | 0.36       | captcha_only | ipRisk (0.95), socialVerification (0.40), accountAge (0.20)                  |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.20  | 14.0%       | 16.3%      | 0.03         |
| karmaScore              | 0.10  | 12.0%       | 14.0%      | 0.01         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.10  | 6.0%        | 7.0%       | 0.01         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.13**     |

---

## Scenario 3: New User with Link

**Description:** A very new user (<1 day) posting with a single URL.

**Author State:**

- Account Age: <1 day
- Karma: no data
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: 1 unique

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                     |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | --------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | enabled-unverified     | 0.43       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | google-verified        | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | residential | disabled               | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | enabled-unverified     | 0.38       | captcha_only      | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | google-verified        | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)     |
| post     | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)     |
| post     | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | enabled-unverified     | 0.54       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)     |
| post     | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | disabled    | disabled               | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | enabled-unverified     | 0.43       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | google-verified        | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | residential | disabled               | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | enabled-unverified     | 0.38       | captcha_only      | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | google-verified        | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)     |
| reply    | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)     |
| reply    | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | enabled-unverified     | 0.54       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)     |
| reply    | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | disabled    | disabled               | 0.45       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | enabled-unverified     | 0.52       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | google-verified        | 0.45       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | google+github-verified | 0.42       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | residential | disabled               | 0.37       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | enabled-unverified     | 0.43       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | google-verified        | 0.37       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | google+github-verified | 0.34       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | datacenter  | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | enabled-unverified     | 0.57       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)     |
| vote     | datacenter  | google-verified        | 0.50       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | google+github-verified | 0.48       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | disabled               | 0.53       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | enabled-unverified     | 0.58       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)     |
| vote     | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | enabled-unverified     | 0.64       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)     |
| vote     | tor         | google-verified        | 0.57       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.85  | 14.0%       | 16.3%      | 0.14         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 9.3%       | 0.05         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.38**     |

---

## Scenario 4: Repeat Link Spammer

**Description:** A user with negative karma, 1 ban, posting the same link repeatedly.

**Author State:**

- Account Age: 7 days
- Karma: -5
- Bans: 1
- Velocity: elevated
- Modqueue Rejection: 50%
- Removal Rate: 30%
- Content Duplicates: none
- URL Spam: 5+ same

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                         |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.55       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| post     | disabled    | enabled-unverified     | 0.59       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), socialVerification (1.00) |
| post     | disabled    | google-verified        | 0.54       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| post     | disabled    | google+github-verified | 0.55       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| post     | residential | disabled               | 0.47       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| post     | residential | enabled-unverified     | 0.52       | captcha_and_oauth | commentUrlRisk (1.00), socialVerification (1.00), karmaScore (0.90) |
| post     | residential | google-verified        | 0.47       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| post     | residential | google+github-verified | 0.47       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), velocityRisk (0.70)       |
| post     | datacenter  | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | datacenter  | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), socialVerification (1.00)     |
| post     | datacenter  | google-verified        | 0.57       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | datacenter  | google+github-verified | 0.58       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | vpn         | disabled               | 0.60       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | vpn         | enabled-unverified     | 0.63       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), socialVerification (1.00)     |
| post     | vpn         | google-verified        | 0.58       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | vpn         | google+github-verified | 0.59       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | tor         | disabled               | 0.65       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | tor         | enabled-unverified     | 0.68       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), socialVerification (1.00)     |
| post     | tor         | google-verified        | 0.63       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| post     | tor         | google+github-verified | 0.63       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | disabled    | disabled               | 0.55       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | disabled    | enabled-unverified     | 0.59       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), socialVerification (1.00) |
| reply    | disabled    | google-verified        | 0.54       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | disabled    | google+github-verified | 0.52       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | residential | disabled               | 0.47       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | residential | enabled-unverified     | 0.52       | captcha_and_oauth | commentUrlRisk (1.00), socialVerification (1.00), karmaScore (0.90) |
| reply    | residential | google-verified        | 0.47       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | residential | google+github-verified | 0.45       | captcha_and_oauth | commentUrlRisk (1.00), karmaScore (0.90), accountAge (0.50)         |
| reply    | datacenter  | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | datacenter  | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), socialVerification (1.00)     |
| reply    | datacenter  | google-verified        | 0.57       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | datacenter  | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.70), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | vpn         | disabled               | 0.60       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | vpn         | enabled-unverified     | 0.63       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), socialVerification (1.00)     |
| reply    | vpn         | google-verified        | 0.58       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | vpn         | google+github-verified | 0.56       | captcha_and_oauth | ipRisk (0.75), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | tor         | disabled               | 0.65       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | tor         | enabled-unverified     | 0.68       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), socialVerification (1.00)     |
| reply    | tor         | google-verified        | 0.63       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| reply    | tor         | google+github-verified | 0.60       | captcha_and_oauth | ipRisk (0.95), commentUrlRisk (1.00), karmaScore (0.90)             |
| vote     | disabled    | disabled               | 0.55       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), velocityRisk (0.40)           |
| vote     | disabled    | enabled-unverified     | 0.60       | captcha_and_oauth | karmaScore (0.90), socialVerification (1.00), accountAge (0.50)     |
| vote     | disabled    | google-verified        | 0.53       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), velocityRisk (0.40)           |
| vote     | disabled    | google+github-verified | 0.50       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), velocityRisk (0.40)           |
| vote     | residential | disabled               | 0.43       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), ipRisk (0.20)                 |
| vote     | residential | enabled-unverified     | 0.49       | captcha_and_oauth | socialVerification (1.00), karmaScore (0.90), accountAge (0.50)     |
| vote     | residential | google-verified        | 0.43       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), ipRisk (0.20)                 |
| vote     | residential | google+github-verified | 0.40       | captcha_and_oauth | karmaScore (0.90), accountAge (0.50), ipRisk (0.20)                 |
| vote     | datacenter  | disabled               | 0.58       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), accountAge (0.50)                 |
| vote     | datacenter  | enabled-unverified     | 0.63       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.90)         |
| vote     | datacenter  | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), accountAge (0.50)                 |
| vote     | datacenter  | google+github-verified | 0.54       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), accountAge (0.50)                 |
| vote     | vpn         | disabled               | 0.60       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), accountAge (0.50)                 |
| vote     | vpn         | enabled-unverified     | 0.64       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.90)         |
| vote     | vpn         | google-verified        | 0.58       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), accountAge (0.50)                 |
| vote     | vpn         | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), accountAge (0.50)                 |
| vote     | tor         | disabled               | 0.66       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), accountAge (0.50)                 |
| vote     | tor         | enabled-unverified     | 0.70       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.90)         |
| vote     | tor         | google-verified        | 0.63       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), accountAge (0.50)                 |
| vote     | tor         | google+github-verified | 0.61       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), accountAge (0.50)                 |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.50  | 14.0%       | 16.3%      | 0.08         |
| karmaScore              | 0.90  | 12.0%       | 14.0%      | 0.13         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 1.00  | 12.0%       | 14.0%      | 0.14         |
| velocityRisk            | 0.40  | 10.0%       | 11.6%      | 0.05         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.40  | 10.0%       | 11.6%      | 0.05         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 9.3%       | 0.05         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.55**     |

---

## Scenario 5: Content Duplicator

**Description:** A user spamming the same content across multiple posts.

**Author State:**

- Account Age: 30 days
- Karma: 0
- Bans: 0
- Velocity: elevated
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: 5+
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                                  |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ---------------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.35       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), accountAge (0.35)         |
| post     | disabled    | enabled-unverified     | 0.40       | captcha_and_oauth | socialVerification (1.00), commentContentTitleRisk (0.55), karmaScore (0.60) |
| post     | disabled    | google-verified        | 0.35       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), accountAge (0.35)         |
| post     | disabled    | google+github-verified | 0.36       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), velocityRisk (0.70)       |
| post     | residential | disabled               | 0.30       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | enabled-unverified     | 0.36       | captcha_only      | socialVerification (1.00), commentContentTitleRisk (0.55), karmaScore (0.60) |
| post     | residential | google-verified        | 0.31       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | google+github-verified | 0.31       | captcha_only      | velocityRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)       |
| post     | datacenter  | disabled               | 0.42       | captcha_and_oauth | ipRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | datacenter  | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| post     | datacenter  | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.70), commentContentTitleRisk (0.55)           |
| post     | vpn         | disabled               | 0.43       | captcha_and_oauth | ipRisk (0.75), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | vpn         | enabled-unverified     | 0.48       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| post     | vpn         | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.75), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.70), commentContentTitleRisk (0.55)           |
| post     | tor         | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.95), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | tor         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| post     | tor         | google-verified        | 0.47       | captcha_and_oauth | ipRisk (0.95), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| post     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.70), commentContentTitleRisk (0.55)           |
| reply    | disabled    | disabled               | 0.35       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), accountAge (0.35)         |
| reply    | disabled    | enabled-unverified     | 0.40       | captcha_and_oauth | socialVerification (1.00), commentContentTitleRisk (0.55), karmaScore (0.60) |
| reply    | disabled    | google-verified        | 0.35       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), accountAge (0.35)         |
| reply    | disabled    | google+github-verified | 0.33       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), accountAge (0.35)         |
| reply    | residential | disabled               | 0.30       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | enabled-unverified     | 0.36       | captcha_only      | socialVerification (1.00), commentContentTitleRisk (0.55), karmaScore (0.60) |
| reply    | residential | google-verified        | 0.31       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | google+github-verified | 0.29       | captcha_only      | commentContentTitleRisk (0.55), karmaScore (0.60), ipRisk (0.20)             |
| reply    | datacenter  | disabled               | 0.42       | captcha_and_oauth | ipRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | datacenter  | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| reply    | datacenter  | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | datacenter  | google+github-verified | 0.39       | captcha_only      | ipRisk (0.70), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | vpn         | disabled               | 0.43       | captcha_and_oauth | ipRisk (0.75), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | vpn         | enabled-unverified     | 0.48       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| reply    | vpn         | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.75), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | vpn         | google+github-verified | 0.40       | captcha_and_oauth | ipRisk (0.75), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | tor         | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.95), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | tor         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), commentContentTitleRisk (0.55)     |
| reply    | tor         | google-verified        | 0.47       | captcha_and_oauth | ipRisk (0.95), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| reply    | tor         | google+github-verified | 0.45       | captcha_and_oauth | ipRisk (0.95), commentContentTitleRisk (0.55), karmaScore (0.60)             |
| vote     | disabled    | disabled               | 0.33       | captcha_only      | karmaScore (0.60), accountAge (0.35), velocityRisk (0.40)                    |
| vote     | disabled    | enabled-unverified     | 0.41       | captcha_and_oauth | socialVerification (1.00), karmaScore (0.60), accountAge (0.35)              |
| vote     | disabled    | google-verified        | 0.34       | captcha_only      | karmaScore (0.60), accountAge (0.35), velocityRisk (0.40)                    |
| vote     | disabled    | google+github-verified | 0.31       | captcha_only      | karmaScore (0.60), accountAge (0.35), velocityRisk (0.40)                    |
| vote     | residential | disabled               | 0.28       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                          |
| vote     | residential | enabled-unverified     | 0.36       | captcha_only      | socialVerification (1.00), karmaScore (0.60), ipRisk (0.20)                  |
| vote     | residential | google-verified        | 0.29       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                          |
| vote     | residential | google+github-verified | 0.26       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                          |
| vote     | datacenter  | disabled               | 0.43       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                          |
| vote     | datacenter  | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.60)                  |
| vote     | datacenter  | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                          |
| vote     | datacenter  | google+github-verified | 0.40       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                          |
| vote     | vpn         | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                          |
| vote     | vpn         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.60)                  |
| vote     | vpn         | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                          |
| vote     | vpn         | google+github-verified | 0.41       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                          |
| vote     | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                          |
| vote     | tor         | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.60)                  |
| vote     | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                          |
| vote     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                          |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.35  | 14.0%       | 16.3%      | 0.06         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.55  | 14.0%       | 16.3%      | 0.09         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.40  | 10.0%       | 11.6%      | 0.05         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.35**     |

---

## Scenario 6: Bot-like Velocity

**Description:** A very new user posting at automated/bot-like rates.

**Author State:**

- Account Age: <1 day
- Karma: no data
- Bans: 0
- Velocity: bot_like
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                       |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ----------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.47       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | disabled    | enabled-unverified     | 0.52       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), socialVerification (1.00) |
| post     | disabled    | google-verified        | 0.47       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | disabled    | google+github-verified | 0.45       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | residential | disabled               | 0.41       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | residential | enabled-unverified     | 0.46       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), velocityRisk (0.95) |
| post     | residential | google-verified        | 0.41       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | residential | google+github-verified | 0.38       | captcha_only      | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| post     | datacenter  | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| post     | datacenter  | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)       |
| post     | datacenter  | google-verified        | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| post     | datacenter  | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| post     | vpn         | disabled               | 0.53       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| post     | vpn         | enabled-unverified     | 0.57       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)       |
| post     | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| post     | vpn         | google+github-verified | 0.50       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| post     | tor         | disabled               | 0.58       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| post     | tor         | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)       |
| post     | tor         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| post     | tor         | google+github-verified | 0.54       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| reply    | disabled    | disabled               | 0.47       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | disabled    | enabled-unverified     | 0.52       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), socialVerification (1.00) |
| reply    | disabled    | google-verified        | 0.47       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | disabled    | google+github-verified | 0.45       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | residential | disabled               | 0.41       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | residential | enabled-unverified     | 0.46       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), velocityRisk (0.95) |
| reply    | residential | google-verified        | 0.41       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | residential | google+github-verified | 0.38       | captcha_only      | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| reply    | datacenter  | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| reply    | datacenter  | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)       |
| reply    | datacenter  | google-verified        | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| reply    | datacenter  | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| reply    | vpn         | disabled               | 0.53       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| reply    | vpn         | enabled-unverified     | 0.57       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)       |
| reply    | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| reply    | vpn         | google+github-verified | 0.50       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| reply    | tor         | disabled               | 0.58       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| reply    | tor         | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)       |
| reply    | tor         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| reply    | tor         | google+github-verified | 0.54       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| vote     | disabled    | disabled               | 0.59       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | disabled    | enabled-unverified     | 0.64       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), socialVerification (1.00) |
| vote     | disabled    | google-verified        | 0.57       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | disabled    | google+github-verified | 0.54       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | residential | disabled               | 0.47       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | residential | enabled-unverified     | 0.53       | captcha_and_oauth | accountAge (0.85), socialVerification (1.00), velocityRisk (0.95) |
| vote     | residential | google-verified        | 0.46       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | residential | google+github-verified | 0.43       | captcha_and_oauth | accountAge (0.85), velocityRisk (0.95), karmaScore (0.60)         |
| vote     | datacenter  | disabled               | 0.62       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| vote     | datacenter  | enabled-unverified     | 0.66       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), socialVerification (1.00)       |
| vote     | datacenter  | google-verified        | 0.60       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| vote     | datacenter  | google+github-verified | 0.57       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), velocityRisk (0.95)             |
| vote     | vpn         | disabled               | 0.63       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| vote     | vpn         | enabled-unverified     | 0.67       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), socialVerification (1.00)       |
| vote     | vpn         | google-verified        | 0.61       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| vote     | vpn         | google+github-verified | 0.58       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), velocityRisk (0.95)             |
| vote     | tor         | disabled               | 0.70       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| vote     | tor         | enabled-unverified     | 0.73       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), socialVerification (1.00)       |
| vote     | tor         | google-verified        | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |
| vote     | tor         | google+github-verified | 0.64       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), velocityRisk (0.95)             |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.85  | 14.0%       | 16.3%      | 0.14         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.95  | 10.0%       | 11.6%      | 0.11         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 9.3%       | 0.05         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.47**     |

---

## Scenario 7: Serial Offender

**Description:** A known bad actor with 3+ bans, negative karma, and moderate spam history.

**Author State:**

- Account Age: 90 days
- Karma: -5
- Bans: 3
- Velocity: elevated
- Modqueue Rejection: 80%
- Removal Rate: 60%
- Content Duplicates: 3
- URL Spam: 1 unique

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                                 |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | --------------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.53       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), commentContentTitleRisk (0.45) |
| post     | disabled    | enabled-unverified     | 0.57       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), socialVerification (1.00)      |
| post     | disabled    | google-verified        | 0.52       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), commentContentTitleRisk (0.45) |
| post     | disabled    | google+github-verified | 0.53       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), velocityRisk (0.70)            |
| post     | residential | disabled               | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| post     | residential | enabled-unverified     | 0.50       | captcha_and_oauth | socialVerification (1.00), karmaScore (0.90), networkBanHistory (0.85)      |
| post     | residential | google-verified        | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| post     | residential | google+github-verified | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), velocityRisk (0.70)            |
| post     | datacenter  | disabled               | 0.57       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | datacenter  | enabled-unverified     | 0.61       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.90)                 |
| post     | datacenter  | google-verified        | 0.55       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | datacenter  | google+github-verified | 0.56       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | vpn         | disabled               | 0.58       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | vpn         | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.90)                 |
| post     | vpn         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | vpn         | google+github-verified | 0.57       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | tor         | disabled               | 0.63       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | tor         | enabled-unverified     | 0.66       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.90)                 |
| post     | tor         | google-verified        | 0.61       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| post     | tor         | google+github-verified | 0.61       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | disabled    | disabled               | 0.53       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), commentContentTitleRisk (0.45) |
| reply    | disabled    | enabled-unverified     | 0.57       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), socialVerification (1.00)      |
| reply    | disabled    | google-verified        | 0.52       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), commentContentTitleRisk (0.45) |
| reply    | disabled    | google+github-verified | 0.50       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), commentContentTitleRisk (0.45) |
| reply    | residential | disabled               | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| reply    | residential | enabled-unverified     | 0.50       | captcha_and_oauth | socialVerification (1.00), karmaScore (0.90), networkBanHistory (0.85)      |
| reply    | residential | google-verified        | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| reply    | residential | google+github-verified | 0.43       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| reply    | datacenter  | disabled               | 0.57       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | datacenter  | enabled-unverified     | 0.61       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.90)                 |
| reply    | datacenter  | google-verified        | 0.55       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | datacenter  | google+github-verified | 0.53       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | vpn         | disabled               | 0.58       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | vpn         | enabled-unverified     | 0.62       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.90)                 |
| reply    | vpn         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | vpn         | google+github-verified | 0.54       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | tor         | disabled               | 0.63       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | tor         | enabled-unverified     | 0.66       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.90)                 |
| reply    | tor         | google-verified        | 0.61       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| reply    | tor         | google+github-verified | 0.59       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | disabled    | disabled               | 0.62       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | disabled    | enabled-unverified     | 0.66       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), socialVerification (1.00)      |
| vote     | disabled    | google-verified        | 0.59       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | disabled    | google+github-verified | 0.56       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | residential | disabled               | 0.49       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | residential | enabled-unverified     | 0.55       | captcha_and_oauth | socialVerification (1.00), karmaScore (0.90), networkBanHistory (0.85)      |
| vote     | residential | google-verified        | 0.48       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | residential | google+github-verified | 0.45       | captcha_and_oauth | karmaScore (0.90), networkBanHistory (0.85), networkRemovalRate (0.70)      |
| vote     | datacenter  | disabled               | 0.64       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | datacenter  | enabled-unverified     | 0.68       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.90)                 |
| vote     | datacenter  | google-verified        | 0.62       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | datacenter  | google+github-verified | 0.59       | captcha_and_oauth | ipRisk (0.70), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | vpn         | disabled               | 0.66       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | vpn         | enabled-unverified     | 0.69       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.90)                 |
| vote     | vpn         | google-verified        | 0.63       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | vpn         | google+github-verified | 0.60       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | tor         | disabled               | 0.72       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | tor         | enabled-unverified     | 0.75       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.90)                 |
| vote     | tor         | google-verified        | 0.68       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |
| vote     | tor         | google+github-verified | 0.66       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.90), networkBanHistory (0.85)                  |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.20  | 14.0%       | 16.3%      | 0.03         |
| karmaScore              | 0.90  | 12.0%       | 14.0%      | 0.13         |
| commentContentTitleRisk | 0.45  | 14.0%       | 16.3%      | 0.07         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.40  | 10.0%       | 11.6%      | 0.05         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.85  | 10.0%       | 11.6%      | 0.10         |
| modqueueRejectionRate   | 0.90  | 6.0%        | 7.0%       | 0.06         |
| networkRemovalRate      | 0.70  | 8.0%        | 9.3%       | 0.07         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.53**     |

---

## Scenario 8: New User, Dual OAuth

**Description:** A brand new user verified via both Google and GitHub OAuth.

**Author State:**

- Account Age: no history
- Karma: no data
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: no urls
- OAuth Verification: google, github

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                     |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | --------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | enabled-unverified     | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | google-verified        | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| post     | residential | disabled               | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | enabled-unverified     | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | google-verified        | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| post     | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | enabled-unverified     | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | google-verified        | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | enabled-unverified     | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | google-verified        | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| post     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | disabled    | disabled               | 0.38       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | enabled-unverified     | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | google-verified        | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | disabled    | google+github-verified | 0.36       | captcha_only      | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| reply    | residential | disabled               | 0.33       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | enabled-unverified     | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | google-verified        | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | residential | google+github-verified | 0.31       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| reply    | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | enabled-unverified     | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | google-verified        | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | enabled-unverified     | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | google-verified        | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| reply    | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | disabled    | disabled               | 0.45       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | enabled-unverified     | 0.42       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | google-verified        | 0.42       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | disabled    | google+github-verified | 0.42       | captcha_and_oauth | accountAge (0.85), karmaScore (0.60), networkRemovalRate (0.50) |
| vote     | residential | disabled               | 0.37       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | enabled-unverified     | 0.34       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | google-verified        | 0.34       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | residential | google+github-verified | 0.34       | captcha_only      | accountAge (0.85), karmaScore (0.60), ipRisk (0.20)             |
| vote     | datacenter  | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | enabled-unverified     | 0.48       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | google-verified        | 0.48       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | datacenter  | google+github-verified | 0.48       | captcha_and_oauth | ipRisk (0.70), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | disabled               | 0.53       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | vpn         | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.75), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | enabled-unverified     | 0.55       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | google-verified        | 0.55       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |
| vote     | tor         | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.95), accountAge (0.85), karmaScore (0.60)             |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.85  | 14.0%       | 16.3%      | 0.14         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 9.3%       | 0.05         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.38**     |

---

## Scenario 9: Vote Spammer

**Description:** A user with bot-like voting velocity.

**Author State:**

- Account Age: 7 days
- Karma: 0
- Bans: 0
- Velocity: bot_like
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                       |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ----------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.38       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| post     | disabled    | enabled-unverified     | 0.43       | captcha_and_oauth | velocityRisk (0.95), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | google-verified        | 0.38       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| post     | disabled    | google+github-verified | 0.36       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| post     | residential | disabled               | 0.33       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| post     | residential | enabled-unverified     | 0.39       | captcha_only      | socialVerification (1.00), velocityRisk (0.95), accountAge (0.50) |
| post     | residential | google-verified        | 0.33       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| post     | residential | google+github-verified | 0.31       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| post     | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| post     | datacenter  | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), velocityRisk (0.95)     |
| post     | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| post     | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| post     | vpn         | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| post     | vpn         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), velocityRisk (0.95)     |
| post     | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| post     | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| post     | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| post     | tor         | enabled-unverified     | 0.54       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), velocityRisk (0.95)     |
| post     | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| post     | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| reply    | disabled    | disabled               | 0.38       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| reply    | disabled    | enabled-unverified     | 0.43       | captcha_and_oauth | velocityRisk (0.95), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | google-verified        | 0.38       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| reply    | disabled    | google+github-verified | 0.36       | captcha_only      | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| reply    | residential | disabled               | 0.33       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| reply    | residential | enabled-unverified     | 0.39       | captcha_only      | socialVerification (1.00), velocityRisk (0.95), accountAge (0.50) |
| reply    | residential | google-verified        | 0.33       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| reply    | residential | google+github-verified | 0.31       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| reply    | datacenter  | disabled               | 0.44       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| reply    | datacenter  | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), velocityRisk (0.95)     |
| reply    | datacenter  | google-verified        | 0.44       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| reply    | datacenter  | google+github-verified | 0.42       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| reply    | vpn         | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| reply    | vpn         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), velocityRisk (0.95)     |
| reply    | vpn         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| reply    | vpn         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| reply    | tor         | disabled               | 0.50       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| reply    | tor         | enabled-unverified     | 0.54       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), velocityRisk (0.95)     |
| reply    | tor         | google-verified        | 0.49       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| reply    | tor         | google+github-verified | 0.47       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| vote     | disabled    | disabled               | 0.46       | captcha_and_oauth | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| vote     | disabled    | enabled-unverified     | 0.52       | captcha_and_oauth | velocityRisk (0.95), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | google-verified        | 0.45       | captcha_and_oauth | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| vote     | disabled    | google+github-verified | 0.42       | captcha_and_oauth | velocityRisk (0.95), karmaScore (0.60), accountAge (0.50)         |
| vote     | residential | disabled               | 0.37       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| vote     | residential | enabled-unverified     | 0.44       | captcha_and_oauth | socialVerification (1.00), velocityRisk (0.95), accountAge (0.50) |
| vote     | residential | google-verified        | 0.37       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| vote     | residential | google+github-verified | 0.34       | captcha_only      | velocityRisk (0.95), accountAge (0.50), karmaScore (0.60)         |
| vote     | datacenter  | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| vote     | datacenter  | enabled-unverified     | 0.57       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), velocityRisk (0.95)     |
| vote     | datacenter  | google-verified        | 0.51       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| vote     | datacenter  | google+github-verified | 0.48       | captcha_and_oauth | ipRisk (0.70), velocityRisk (0.95), accountAge (0.50)             |
| vote     | vpn         | disabled               | 0.53       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| vote     | vpn         | enabled-unverified     | 0.58       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), velocityRisk (0.95)     |
| vote     | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| vote     | vpn         | google+github-verified | 0.49       | captcha_and_oauth | ipRisk (0.75), velocityRisk (0.95), accountAge (0.50)             |
| vote     | tor         | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| vote     | tor         | enabled-unverified     | 0.64       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), velocityRisk (0.95)     |
| vote     | tor         | google-verified        | 0.57       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |
| vote     | tor         | google+github-verified | 0.55       | captcha_and_oauth | ipRisk (0.95), velocityRisk (0.95), accountAge (0.50)             |

### Factor Breakdown: vote / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.50  | 14.0%       | 23.3%      | 0.12         |
| karmaScore              | 0.60  | 12.0%       | 20.0%      | 0.12         |
| commentContentTitleRisk | 0.00  | 0.0%        | 0.0%       | (skipped)    |
| commentUrlRisk          | 0.00  | 0.0%        | 0.0%       | (skipped)    |
| velocityRisk            | 0.95  | 10.0%       | 16.7%      | 0.16         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 16.7%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 10.0%      | 0.05         |
| networkRemovalRate      | 0.10  | 8.0%        | 13.3%      | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.46**     |

---

## Scenario 10: Trusted Reply Author

**Description:** An established user making a reply with positive karma.

**Author State:**

- Account Age: 365+ days
- Karma: +3
- Bans: 0
- Velocity: normal
- Modqueue Rejection: 0%
- Removal Rate: 0%
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                                  |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ---------------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.13       | auto_accept       | commentContentTitleRisk (0.20), karmaScore (0.20), commentUrlRisk (0.20)     |
| post     | disabled    | enabled-unverified     | 0.21       | captcha_only      | socialVerification (1.00), commentContentTitleRisk (0.20), karmaScore (0.20) |
| post     | disabled    | google-verified        | 0.16       | auto_accept       | socialVerification (0.40), commentContentTitleRisk (0.20), karmaScore (0.20) |
| post     | disabled    | google+github-verified | 0.13       | auto_accept       | commentContentTitleRisk (0.20), karmaScore (0.20), commentUrlRisk (0.20)     |
| post     | residential | disabled               | 0.15       | auto_accept       | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | residential | enabled-unverified     | 0.22       | captcha_only      | socialVerification (1.00), ipRisk (0.20), commentContentTitleRisk (0.20)     |
| post     | residential | google-verified        | 0.17       | auto_accept       | ipRisk (0.20), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| post     | residential | google+github-verified | 0.15       | auto_accept       | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | datacenter  | disabled               | 0.26       | captcha_only      | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | datacenter  | enabled-unverified     | 0.33       | captcha_only      | ipRisk (0.70), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| post     | datacenter  | google-verified        | 0.27       | captcha_only      | ipRisk (0.70), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| post     | datacenter  | google+github-verified | 0.25       | captcha_only      | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | vpn         | disabled               | 0.27       | captcha_only      | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | vpn         | enabled-unverified     | 0.34       | captcha_only      | ipRisk (0.75), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| post     | vpn         | google-verified        | 0.29       | captcha_only      | ipRisk (0.75), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| post     | vpn         | google+github-verified | 0.26       | captcha_only      | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | tor         | disabled               | 0.32       | captcha_only      | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| post     | tor         | enabled-unverified     | 0.38       | captcha_only      | ipRisk (0.95), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| post     | tor         | google-verified        | 0.33       | captcha_only      | ipRisk (0.95), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| post     | tor         | google+github-verified | 0.31       | captcha_only      | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | disabled    | disabled               | 0.13       | auto_accept       | commentContentTitleRisk (0.20), karmaScore (0.20), commentUrlRisk (0.20)     |
| reply    | disabled    | enabled-unverified     | 0.21       | captcha_only      | socialVerification (1.00), commentContentTitleRisk (0.20), karmaScore (0.20) |
| reply    | disabled    | google-verified        | 0.16       | auto_accept       | socialVerification (0.40), commentContentTitleRisk (0.20), karmaScore (0.20) |
| reply    | disabled    | google+github-verified | 0.13       | auto_accept       | commentContentTitleRisk (0.20), karmaScore (0.20), commentUrlRisk (0.20)     |
| reply    | residential | disabled               | 0.15       | auto_accept       | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | residential | enabled-unverified     | 0.22       | captcha_only      | socialVerification (1.00), ipRisk (0.20), commentContentTitleRisk (0.20)     |
| reply    | residential | google-verified        | 0.17       | auto_accept       | ipRisk (0.20), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| reply    | residential | google+github-verified | 0.15       | auto_accept       | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | datacenter  | disabled               | 0.26       | captcha_only      | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | datacenter  | enabled-unverified     | 0.33       | captcha_only      | ipRisk (0.70), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| reply    | datacenter  | google-verified        | 0.27       | captcha_only      | ipRisk (0.70), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| reply    | datacenter  | google+github-verified | 0.25       | captcha_only      | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | vpn         | disabled               | 0.27       | captcha_only      | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | vpn         | enabled-unverified     | 0.34       | captcha_only      | ipRisk (0.75), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| reply    | vpn         | google-verified        | 0.29       | captcha_only      | ipRisk (0.75), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| reply    | vpn         | google+github-verified | 0.26       | captcha_only      | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | tor         | disabled               | 0.32       | captcha_only      | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| reply    | tor         | enabled-unverified     | 0.38       | captcha_only      | ipRisk (0.95), socialVerification (1.00), commentContentTitleRisk (0.20)     |
| reply    | tor         | google-verified        | 0.33       | captcha_only      | ipRisk (0.95), socialVerification (0.40), commentContentTitleRisk (0.20)     |
| reply    | tor         | google+github-verified | 0.31       | captcha_only      | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)         |
| vote     | disabled    | disabled               | 0.10       | auto_accept       | karmaScore (0.20), accountAge (0.10), velocityRisk (0.10)                    |
| vote     | disabled    | enabled-unverified     | 0.21       | captcha_only      | socialVerification (1.00), karmaScore (0.20), accountAge (0.10)              |
| vote     | disabled    | google-verified        | 0.14       | auto_accept       | socialVerification (0.40), karmaScore (0.20), accountAge (0.10)              |
| vote     | disabled    | google+github-verified | 0.11       | auto_accept       | karmaScore (0.20), accountAge (0.10), socialVerification (0.16)              |
| vote     | residential | disabled               | 0.13       | auto_accept       | ipRisk (0.20), karmaScore (0.20), accountAge (0.10)                          |
| vote     | residential | enabled-unverified     | 0.22       | captcha_only      | socialVerification (1.00), ipRisk (0.20), karmaScore (0.20)                  |
| vote     | residential | google-verified        | 0.16       | auto_accept       | ipRisk (0.20), socialVerification (0.40), karmaScore (0.20)                  |
| vote     | residential | google+github-verified | 0.13       | auto_accept       | ipRisk (0.20), karmaScore (0.20), socialVerification (0.16)                  |
| vote     | datacenter  | disabled               | 0.28       | captcha_only      | ipRisk (0.70), karmaScore (0.20), accountAge (0.10)                          |
| vote     | datacenter  | enabled-unverified     | 0.36       | captcha_only      | ipRisk (0.70), socialVerification (1.00), karmaScore (0.20)                  |
| vote     | datacenter  | google-verified        | 0.29       | captcha_only      | ipRisk (0.70), socialVerification (0.40), karmaScore (0.20)                  |
| vote     | datacenter  | google+github-verified | 0.27       | captcha_only      | ipRisk (0.70), karmaScore (0.20), socialVerification (0.16)                  |
| vote     | vpn         | disabled               | 0.30       | captcha_only      | ipRisk (0.75), karmaScore (0.20), accountAge (0.10)                          |
| vote     | vpn         | enabled-unverified     | 0.37       | captcha_only      | ipRisk (0.75), socialVerification (1.00), karmaScore (0.20)                  |
| vote     | vpn         | google-verified        | 0.31       | captcha_only      | ipRisk (0.75), socialVerification (0.40), karmaScore (0.20)                  |
| vote     | vpn         | google+github-verified | 0.28       | captcha_only      | ipRisk (0.75), karmaScore (0.20), socialVerification (0.16)                  |
| vote     | tor         | disabled               | 0.36       | captcha_only      | ipRisk (0.95), karmaScore (0.20), accountAge (0.10)                          |
| vote     | tor         | enabled-unverified     | 0.43       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.20)                  |
| vote     | tor         | google-verified        | 0.36       | captcha_only      | ipRisk (0.95), socialVerification (0.40), karmaScore (0.20)                  |
| vote     | tor         | google+github-verified | 0.34       | captcha_only      | ipRisk (0.95), karmaScore (0.20), socialVerification (0.16)                  |

### Factor Breakdown: reply / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.10  | 14.0%       | 16.3%      | 0.02         |
| karmaScore              | 0.20  | 12.0%       | 14.0%      | 0.03         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.10  | 6.0%        | 7.0%       | 0.01         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.13**     |

---

## Scenario 11: Borderline Modqueue

**Description:** A moderately established user with 50% modqueue rejection rate.

**Author State:**

- Account Age: 30 days
- Karma: 0
- Bans: 0
- Velocity: normal
- Modqueue Rejection: 50%
- Removal Rate: 0%
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                        |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | ------------------------------------------------------------------ |
| post     | disabled    | disabled               | 0.26       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| post     | disabled    | enabled-unverified     | 0.32       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.35)    |
| post     | disabled    | google-verified        | 0.27       | captcha_only      | karmaScore (0.60), accountAge (0.35), socialVerification (0.40)    |
| post     | disabled    | google+github-verified | 0.25       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| post     | residential | disabled               | 0.23       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| post     | residential | enabled-unverified     | 0.30       | captcha_only      | socialVerification (1.00), karmaScore (0.60), ipRisk (0.20)        |
| post     | residential | google-verified        | 0.25       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| post     | residential | google+github-verified | 0.23       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| post     | datacenter  | disabled               | 0.35       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| post     | datacenter  | enabled-unverified     | 0.40       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.60)        |
| post     | datacenter  | google-verified        | 0.35       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| post     | datacenter  | google+github-verified | 0.33       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| post     | vpn         | disabled               | 0.36       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| post     | vpn         | enabled-unverified     | 0.41       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.60)        |
| post     | vpn         | google-verified        | 0.36       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| post     | vpn         | google+github-verified | 0.34       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| post     | tor         | disabled               | 0.41       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| post     | tor         | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.60)        |
| post     | tor         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| post     | tor         | google+github-verified | 0.38       | captcha_only      | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| reply    | disabled    | disabled               | 0.26       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| reply    | disabled    | enabled-unverified     | 0.32       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.35)    |
| reply    | disabled    | google-verified        | 0.27       | captcha_only      | karmaScore (0.60), accountAge (0.35), socialVerification (0.40)    |
| reply    | disabled    | google+github-verified | 0.25       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| reply    | residential | disabled               | 0.23       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| reply    | residential | enabled-unverified     | 0.30       | captcha_only      | socialVerification (1.00), karmaScore (0.60), ipRisk (0.20)        |
| reply    | residential | google-verified        | 0.25       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| reply    | residential | google+github-verified | 0.23       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| reply    | datacenter  | disabled               | 0.35       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| reply    | datacenter  | enabled-unverified     | 0.40       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.60)        |
| reply    | datacenter  | google-verified        | 0.35       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| reply    | datacenter  | google+github-verified | 0.33       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| reply    | vpn         | disabled               | 0.36       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| reply    | vpn         | enabled-unverified     | 0.41       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.60)        |
| reply    | vpn         | google-verified        | 0.36       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| reply    | vpn         | google+github-verified | 0.34       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| reply    | tor         | disabled               | 0.41       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| reply    | tor         | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.60)        |
| reply    | tor         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| reply    | tor         | google+github-verified | 0.38       | captcha_only      | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| vote     | disabled    | disabled               | 0.28       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| vote     | disabled    | enabled-unverified     | 0.37       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.35)    |
| vote     | disabled    | google-verified        | 0.30       | captcha_only      | karmaScore (0.60), accountAge (0.35), socialVerification (0.40)    |
| vote     | disabled    | google+github-verified | 0.27       | captcha_only      | karmaScore (0.60), accountAge (0.35), modqueueRejectionRate (0.50) |
| vote     | residential | disabled               | 0.24       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| vote     | residential | enabled-unverified     | 0.32       | captcha_only      | socialVerification (1.00), karmaScore (0.60), ipRisk (0.20)        |
| vote     | residential | google-verified        | 0.26       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| vote     | residential | google+github-verified | 0.23       | captcha_only      | karmaScore (0.60), ipRisk (0.20), accountAge (0.35)                |
| vote     | datacenter  | disabled               | 0.39       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| vote     | datacenter  | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), karmaScore (0.60)        |
| vote     | datacenter  | google-verified        | 0.39       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| vote     | datacenter  | google+github-verified | 0.37       | captcha_only      | ipRisk (0.70), karmaScore (0.60), accountAge (0.35)                |
| vote     | vpn         | disabled               | 0.41       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| vote     | vpn         | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), karmaScore (0.60)        |
| vote     | vpn         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| vote     | vpn         | google+github-verified | 0.38       | captcha_only      | ipRisk (0.75), karmaScore (0.60), accountAge (0.35)                |
| vote     | tor         | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| vote     | tor         | enabled-unverified     | 0.53       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), karmaScore (0.60)        |
| vote     | tor         | google-verified        | 0.46       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |
| vote     | tor         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.95), karmaScore (0.60), accountAge (0.35)                |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.35  | 14.0%       | 16.3%      | 0.06         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.26**     |

---

## Scenario 12: High Removal Rate

**Description:** An established user whose content is frequently removed (60%).

**Author State:**

- Account Age: 90 days
- Karma: 0
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: 60%
- Content Duplicates: none
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                                |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | -------------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.31       | captcha_only      | karmaScore (0.60), networkRemovalRate (0.90), modqueueRejectionRate (0.50) |
| post     | disabled    | enabled-unverified     | 0.37       | captcha_only      | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| post     | disabled    | google-verified        | 0.31       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), socialVerification (0.40)    |
| post     | disabled    | google+github-verified | 0.29       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), modqueueRejectionRate (0.50) |
| post     | residential | disabled               | 0.29       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| post     | residential | enabled-unverified     | 0.35       | captcha_only      | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| post     | residential | google-verified        | 0.30       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| post     | residential | google+github-verified | 0.28       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| post     | datacenter  | disabled               | 0.40       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | datacenter  | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), networkRemovalRate (0.90)        |
| post     | datacenter  | google-verified        | 0.40       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | datacenter  | google+github-verified | 0.38       | captcha_only      | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | vpn         | disabled               | 0.42       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | vpn         | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), networkRemovalRate (0.90)        |
| post     | vpn         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | vpn         | google+github-verified | 0.39       | captcha_only      | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | tor         | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | tor         | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), networkRemovalRate (0.90)        |
| post     | tor         | google-verified        | 0.46       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| post     | tor         | google+github-verified | 0.44       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | disabled    | disabled               | 0.31       | captcha_only      | karmaScore (0.60), networkRemovalRate (0.90), modqueueRejectionRate (0.50) |
| reply    | disabled    | enabled-unverified     | 0.37       | captcha_only      | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| reply    | disabled    | google-verified        | 0.31       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), socialVerification (0.40)    |
| reply    | disabled    | google+github-verified | 0.29       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), modqueueRejectionRate (0.50) |
| reply    | residential | disabled               | 0.29       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| reply    | residential | enabled-unverified     | 0.35       | captcha_only      | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| reply    | residential | google-verified        | 0.30       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| reply    | residential | google+github-verified | 0.28       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| reply    | datacenter  | disabled               | 0.40       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | datacenter  | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), networkRemovalRate (0.90)        |
| reply    | datacenter  | google-verified        | 0.40       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | datacenter  | google+github-verified | 0.38       | captcha_only      | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | vpn         | disabled               | 0.42       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | vpn         | enabled-unverified     | 0.47       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), networkRemovalRate (0.90)        |
| reply    | vpn         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | vpn         | google+github-verified | 0.39       | captcha_only      | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | tor         | disabled               | 0.46       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | tor         | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), networkRemovalRate (0.90)        |
| reply    | tor         | google-verified        | 0.46       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| reply    | tor         | google+github-verified | 0.44       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | disabled    | disabled               | 0.35       | captcha_only      | karmaScore (0.60), networkRemovalRate (0.90), modqueueRejectionRate (0.50) |
| vote     | disabled    | enabled-unverified     | 0.43       | captcha_and_oauth | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| vote     | disabled    | google-verified        | 0.36       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), socialVerification (0.40)    |
| vote     | disabled    | google+github-verified | 0.33       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), modqueueRejectionRate (0.50) |
| vote     | residential | disabled               | 0.32       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| vote     | residential | enabled-unverified     | 0.39       | captcha_only      | socialVerification (1.00), networkRemovalRate (0.90), karmaScore (0.60)    |
| vote     | residential | google-verified        | 0.32       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| vote     | residential | google+github-verified | 0.30       | captcha_only      | networkRemovalRate (0.90), karmaScore (0.60), ipRisk (0.20)                |
| vote     | datacenter  | disabled               | 0.47       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | datacenter  | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), networkRemovalRate (0.90)        |
| vote     | datacenter  | google-verified        | 0.46       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | datacenter  | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.70), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | vpn         | disabled               | 0.48       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | vpn         | enabled-unverified     | 0.54       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), networkRemovalRate (0.90)        |
| vote     | vpn         | google-verified        | 0.47       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | vpn         | google+github-verified | 0.45       | captcha_and_oauth | ipRisk (0.75), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | tor         | disabled               | 0.54       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | tor         | enabled-unverified     | 0.59       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), networkRemovalRate (0.90)        |
| vote     | tor         | google-verified        | 0.53       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |
| vote     | tor         | google+github-verified | 0.50       | captcha_and_oauth | ipRisk (0.95), networkRemovalRate (0.90), karmaScore (0.60)                |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.20  | 14.0%       | 16.3%      | 0.03         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.90  | 8.0%        | 9.3%       | 0.08         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.31**     |

---

## Scenario 13: New, OAuth Unverified

**Description:** A new user where OAuth is enabled but they haven't verified.

**Author State:**

- Account Age: no history
- Karma: no data
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: none
- URL Spam: no urls
- OAuth Verification: none (but enabled)

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                     |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | --------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | google-verified        | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | disabled    | google+github-verified | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | disabled               | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | enabled-unverified     | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | google-verified        | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | residential | google+github-verified | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| post     | datacenter  | disabled               | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| post     | datacenter  | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| post     | datacenter  | google-verified        | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| post     | datacenter  | google+github-verified | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| post     | vpn         | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| post     | vpn         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| post     | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| post     | vpn         | google+github-verified | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| post     | tor         | disabled               | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| post     | tor         | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| post     | tor         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| post     | tor         | google+github-verified | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| reply    | disabled    | disabled               | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | google-verified        | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | disabled    | google+github-verified | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | disabled               | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | enabled-unverified     | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | google-verified        | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | residential | google+github-verified | 0.40       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| reply    | datacenter  | disabled               | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| reply    | datacenter  | enabled-unverified     | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| reply    | datacenter  | google-verified        | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| reply    | datacenter  | google+github-verified | 0.51       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| reply    | vpn         | disabled               | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| reply    | vpn         | enabled-unverified     | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| reply    | vpn         | google-verified        | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| reply    | vpn         | google+github-verified | 0.52       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| reply    | tor         | disabled               | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| reply    | tor         | enabled-unverified     | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| reply    | tor         | google-verified        | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| reply    | tor         | google+github-verified | 0.56       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| vote     | disabled    | disabled               | 0.55       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | enabled-unverified     | 0.55       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | google-verified        | 0.55       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | disabled    | google+github-verified | 0.55       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | disabled               | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | enabled-unverified     | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | google-verified        | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | residential | google+github-verified | 0.45       | captcha_and_oauth | accountAge (1.00), socialVerification (1.00), karmaScore (0.60) |
| vote     | datacenter  | disabled               | 0.59       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| vote     | datacenter  | enabled-unverified     | 0.59       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| vote     | datacenter  | google-verified        | 0.59       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| vote     | datacenter  | google+github-verified | 0.59       | captcha_and_oauth | ipRisk (0.70), accountAge (1.00), socialVerification (1.00)     |
| vote     | vpn         | disabled               | 0.60       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| vote     | vpn         | enabled-unverified     | 0.60       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| vote     | vpn         | google-verified        | 0.60       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| vote     | vpn         | google+github-verified | 0.60       | captcha_and_oauth | ipRisk (0.75), accountAge (1.00), socialVerification (1.00)     |
| vote     | tor         | disabled               | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| vote     | tor         | enabled-unverified     | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| vote     | tor         | google-verified        | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |
| vote     | tor         | google+github-verified | 0.66       | captcha_and_oauth | ipRisk (0.95), accountAge (1.00), socialVerification (1.00)     |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 1.00  | 14.0%       | 14.9%      | 0.15         |
| karmaScore              | 0.60  | 12.0%       | 12.8%      | 0.08         |
| commentContentTitleRisk | 0.20  | 14.0%       | 14.9%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 12.8%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 10.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 10.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 6.4%       | 0.03         |
| networkRemovalRate      | 0.50  | 8.0%        | 8.5%       | 0.04         |
| socialVerification      | 1.00  | 8.0%        | 8.5%       | 0.09         |
| **Total**               |       |             | 100%       | **0.45**     |

---

## Scenario 14: Moderate Content Spam

**Description:** A user with 3 duplicate content posts.

**Author State:**

- Account Age: 7 days
- Karma: 0
- Bans: 0
- Velocity: normal
- Modqueue Rejection: no_data
- Removal Rate: no_data
- Content Duplicates: 3
- URL Spam: no urls

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier              | Top Factors                                                          |
| -------- | ----------- | ---------------------- | ---------- | ----------------- | -------------------------------------------------------------------- |
| post     | disabled    | disabled               | 0.32       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| post     | disabled    | enabled-unverified     | 0.38       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.50)      |
| post     | disabled    | google-verified        | 0.33       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| post     | disabled    | google+github-verified | 0.31       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| post     | residential | disabled               | 0.28       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| post     | residential | enabled-unverified     | 0.34       | captcha_only      | socialVerification (1.00), accountAge (0.50), karmaScore (0.60)      |
| post     | residential | google-verified        | 0.29       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| post     | residential | google+github-verified | 0.27       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| post     | datacenter  | disabled               | 0.39       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| post     | datacenter  | enabled-unverified     | 0.45       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), accountAge (0.50)          |
| post     | datacenter  | google-verified        | 0.39       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| post     | datacenter  | google+github-verified | 0.37       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| post     | vpn         | disabled               | 0.41       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| post     | vpn         | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), accountAge (0.50)          |
| post     | vpn         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| post     | vpn         | google+github-verified | 0.38       | captcha_only      | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| post     | tor         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| post     | tor         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), accountAge (0.50)          |
| post     | tor         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| post     | tor         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| reply    | disabled    | disabled               | 0.32       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| reply    | disabled    | enabled-unverified     | 0.38       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.50)      |
| reply    | disabled    | google-verified        | 0.33       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| reply    | disabled    | google+github-verified | 0.31       | captcha_only      | karmaScore (0.60), accountAge (0.50), commentContentTitleRisk (0.45) |
| reply    | residential | disabled               | 0.28       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| reply    | residential | enabled-unverified     | 0.34       | captcha_only      | socialVerification (1.00), accountAge (0.50), karmaScore (0.60)      |
| reply    | residential | google-verified        | 0.29       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| reply    | residential | google+github-verified | 0.27       | captcha_only      | accountAge (0.50), karmaScore (0.60), commentContentTitleRisk (0.45) |
| reply    | datacenter  | disabled               | 0.39       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| reply    | datacenter  | enabled-unverified     | 0.45       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), accountAge (0.50)          |
| reply    | datacenter  | google-verified        | 0.39       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| reply    | datacenter  | google+github-verified | 0.37       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| reply    | vpn         | disabled               | 0.41       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| reply    | vpn         | enabled-unverified     | 0.46       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), accountAge (0.50)          |
| reply    | vpn         | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| reply    | vpn         | google+github-verified | 0.38       | captcha_only      | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| reply    | tor         | disabled               | 0.45       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| reply    | tor         | enabled-unverified     | 0.50       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), accountAge (0.50)          |
| reply    | tor         | google-verified        | 0.45       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| reply    | tor         | google+github-verified | 0.43       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| vote     | disabled    | disabled               | 0.32       | captcha_only      | karmaScore (0.60), accountAge (0.50), modqueueRejectionRate (0.50)   |
| vote     | disabled    | enabled-unverified     | 0.40       | captcha_only      | socialVerification (1.00), karmaScore (0.60), accountAge (0.50)      |
| vote     | disabled    | google-verified        | 0.33       | captcha_only      | karmaScore (0.60), accountAge (0.50), socialVerification (0.40)      |
| vote     | disabled    | google+github-verified | 0.30       | captcha_only      | karmaScore (0.60), accountAge (0.50), modqueueRejectionRate (0.50)   |
| vote     | residential | disabled               | 0.26       | captcha_only      | accountAge (0.50), karmaScore (0.60), ipRisk (0.20)                  |
| vote     | residential | enabled-unverified     | 0.34       | captcha_only      | socialVerification (1.00), accountAge (0.50), karmaScore (0.60)      |
| vote     | residential | google-verified        | 0.28       | captcha_only      | accountAge (0.50), karmaScore (0.60), ipRisk (0.20)                  |
| vote     | residential | google+github-verified | 0.25       | captcha_only      | accountAge (0.50), karmaScore (0.60), ipRisk (0.20)                  |
| vote     | datacenter  | disabled               | 0.42       | captcha_and_oauth | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| vote     | datacenter  | enabled-unverified     | 0.48       | captcha_and_oauth | ipRisk (0.70), socialVerification (1.00), accountAge (0.50)          |
| vote     | datacenter  | google-verified        | 0.41       | captcha_and_oauth | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| vote     | datacenter  | google+github-verified | 0.39       | captcha_only      | ipRisk (0.70), accountAge (0.50), karmaScore (0.60)                  |
| vote     | vpn         | disabled               | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| vote     | vpn         | enabled-unverified     | 0.49       | captcha_and_oauth | ipRisk (0.75), socialVerification (1.00), accountAge (0.50)          |
| vote     | vpn         | google-verified        | 0.43       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| vote     | vpn         | google+github-verified | 0.40       | captcha_and_oauth | ipRisk (0.75), accountAge (0.50), karmaScore (0.60)                  |
| vote     | tor         | disabled               | 0.49       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| vote     | tor         | enabled-unverified     | 0.55       | captcha_and_oauth | ipRisk (0.95), socialVerification (1.00), accountAge (0.50)          |
| vote     | tor         | google-verified        | 0.48       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |
| vote     | tor         | google+github-verified | 0.45       | captcha_and_oauth | ipRisk (0.95), accountAge (0.50), karmaScore (0.60)                  |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.50  | 14.0%       | 16.3%      | 0.08         |
| karmaScore              | 0.60  | 12.0%       | 14.0%      | 0.08         |
| commentContentTitleRisk | 0.45  | 14.0%       | 16.3%      | 0.07         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.50  | 6.0%        | 7.0%       | 0.03         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.32**     |

---

## Scenario 15: Perfect User

**Description:** An ideal user with 365+ days history, +5 karma, dual OAuth, and clean record.

**Author State:**

- Account Age: 365+ days
- Karma: +5
- Bans: 0
- Velocity: normal
- Modqueue Rejection: 0%
- Removal Rate: 0%
- Content Duplicates: none
- URL Spam: no urls
- OAuth Verification: google, github

### Full Configuration Matrix

| Pub Type | IP Type     | OAuth Config           | Risk Score | Tier         | Top Factors                                                              |
| -------- | ----------- | ---------------------- | ---------- | ------------ | ------------------------------------------------------------------------ |
| post     | disabled    | disabled               | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| post     | disabled    | enabled-unverified     | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| post     | disabled    | google-verified        | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| post     | disabled    | google+github-verified | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| post     | residential | disabled               | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | residential | enabled-unverified     | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | residential | google-verified        | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | residential | google+github-verified | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | datacenter  | disabled               | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | datacenter  | enabled-unverified     | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | datacenter  | google-verified        | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | datacenter  | google+github-verified | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | vpn         | disabled               | 0.27       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | vpn         | enabled-unverified     | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | vpn         | google-verified        | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | vpn         | google+github-verified | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | tor         | disabled               | 0.31       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | tor         | enabled-unverified     | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | tor         | google-verified        | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| post     | tor         | google+github-verified | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | disabled    | disabled               | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| reply    | disabled    | enabled-unverified     | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| reply    | disabled    | google-verified        | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| reply    | disabled    | google+github-verified | 0.12       | auto_accept  | commentContentTitleRisk (0.20), commentUrlRisk (0.20), accountAge (0.10) |
| reply    | residential | disabled               | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | residential | enabled-unverified     | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | residential | google-verified        | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | residential | google+github-verified | 0.14       | auto_accept  | ipRisk (0.20), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | datacenter  | disabled               | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | datacenter  | enabled-unverified     | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | datacenter  | google-verified        | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | datacenter  | google+github-verified | 0.25       | captcha_only | ipRisk (0.70), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | vpn         | disabled               | 0.27       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | vpn         | enabled-unverified     | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | vpn         | google-verified        | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | vpn         | google+github-verified | 0.26       | captcha_only | ipRisk (0.75), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | tor         | disabled               | 0.31       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | tor         | enabled-unverified     | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | tor         | google-verified        | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| reply    | tor         | google+github-verified | 0.30       | captcha_only | ipRisk (0.95), commentContentTitleRisk (0.20), commentUrlRisk (0.20)     |
| vote     | disabled    | disabled               | 0.08       | auto_accept  | accountAge (0.10), karmaScore (0.10), velocityRisk (0.10)                |
| vote     | disabled    | enabled-unverified     | 0.09       | auto_accept  | accountAge (0.10), socialVerification (0.16), karmaScore (0.10)          |
| vote     | disabled    | google-verified        | 0.09       | auto_accept  | accountAge (0.10), socialVerification (0.16), karmaScore (0.10)          |
| vote     | disabled    | google+github-verified | 0.09       | auto_accept  | accountAge (0.10), socialVerification (0.16), karmaScore (0.10)          |
| vote     | residential | disabled               | 0.12       | auto_accept  | ipRisk (0.20), accountAge (0.10), karmaScore (0.10)                      |
| vote     | residential | enabled-unverified     | 0.12       | auto_accept  | ipRisk (0.20), socialVerification (0.16), accountAge (0.10)              |
| vote     | residential | google-verified        | 0.12       | auto_accept  | ipRisk (0.20), socialVerification (0.16), accountAge (0.10)              |
| vote     | residential | google+github-verified | 0.12       | auto_accept  | ipRisk (0.20), socialVerification (0.16), accountAge (0.10)              |
| vote     | datacenter  | disabled               | 0.27       | captcha_only | ipRisk (0.70), accountAge (0.10), karmaScore (0.10)                      |
| vote     | datacenter  | enabled-unverified     | 0.26       | captcha_only | ipRisk (0.70), socialVerification (0.16), accountAge (0.10)              |
| vote     | datacenter  | google-verified        | 0.26       | captcha_only | ipRisk (0.70), socialVerification (0.16), accountAge (0.10)              |
| vote     | datacenter  | google+github-verified | 0.26       | captcha_only | ipRisk (0.70), socialVerification (0.16), accountAge (0.10)              |
| vote     | vpn         | disabled               | 0.28       | captcha_only | ipRisk (0.75), accountAge (0.10), karmaScore (0.10)                      |
| vote     | vpn         | enabled-unverified     | 0.27       | captcha_only | ipRisk (0.75), socialVerification (0.16), accountAge (0.10)              |
| vote     | vpn         | google-verified        | 0.27       | captcha_only | ipRisk (0.75), socialVerification (0.16), accountAge (0.10)              |
| vote     | vpn         | google+github-verified | 0.27       | captcha_only | ipRisk (0.75), socialVerification (0.16), accountAge (0.10)              |
| vote     | tor         | disabled               | 0.35       | captcha_only | ipRisk (0.95), accountAge (0.10), karmaScore (0.10)                      |
| vote     | tor         | enabled-unverified     | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.16), accountAge (0.10)              |
| vote     | tor         | google-verified        | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.16), accountAge (0.10)              |
| vote     | tor         | google+github-verified | 0.33       | captcha_only | ipRisk (0.95), socialVerification (0.16), accountAge (0.10)              |

### Factor Breakdown: post / disabled / disabled

| Factor                  | Score | Orig Weight | Eff Weight | Contribution |
| ----------------------- | ----- | ----------- | ---------- | ------------ |
| accountAge              | 0.10  | 14.0%       | 16.3%      | 0.02         |
| karmaScore              | 0.10  | 12.0%       | 14.0%      | 0.01         |
| commentContentTitleRisk | 0.20  | 14.0%       | 16.3%      | 0.03         |
| commentUrlRisk          | 0.20  | 12.0%       | 14.0%      | 0.03         |
| velocityRisk            | 0.10  | 10.0%       | 11.6%      | 0.01         |
| ipRisk                  | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| networkBanHistory       | 0.00  | 10.0%       | 11.6%      | 0.00         |
| modqueueRejectionRate   | 0.10  | 6.0%        | 7.0%       | 0.01         |
| networkRemovalRate      | 0.10  | 8.0%        | 9.3%       | 0.01         |
| socialVerification      | 0.50  | 0.0%        | 0.0%       | (skipped)    |
| **Total**               |       |             | 100%       | **0.12**     |

---

## Summary

Risk score ranges across all configurations for each scenario:

| Scenario                    | Min Score | Max Score | Tier Range                                   |
| --------------------------- | --------- | --------- | -------------------------------------------- |
| 1. Brand New User           | 0.31      | 0.66      | captcha_and_oauth, captcha_only              |
| 2. Established Trusted User | 0.11      | 0.36      | auto_accept, captcha_only                    |
| 3. New User with Link       | 0.31      | 0.64      | captcha_only, captcha_and_oauth              |
| 4. Repeat Link Spammer      | 0.40      | 0.70      | captcha_and_oauth                            |
| 5. Content Duplicator       | 0.26      | 0.56      | captcha_only, captcha_and_oauth              |
| 6. Bot-like Velocity        | 0.38      | 0.73      | captcha_and_oauth, captcha_only              |
| 7. Serial Offender          | 0.43      | 0.75      | captcha_and_oauth                            |
| 8. New User, Dual OAuth     | 0.31      | 0.59      | captcha_only, captcha_and_oauth              |
| 9. Vote Spammer             | 0.31      | 0.64      | captcha_only, captcha_and_oauth              |
| 10. Trusted Reply Author    | 0.10      | 0.43      | auto_accept, captcha_only, captcha_and_oauth |
| 11. Borderline Modqueue     | 0.23      | 0.53      | captcha_only, captcha_and_oauth              |
| 12. High Removal Rate       | 0.28      | 0.59      | captcha_only, captcha_and_oauth              |
| 13. New, OAuth Unverified   | 0.40      | 0.66      | captcha_and_oauth                            |
| 14. Moderate Content Spam   | 0.25      | 0.55      | captcha_only, captcha_and_oauth              |
| 15. Perfect User            | 0.08      | 0.35      | auto_accept, captcha_only                    |
