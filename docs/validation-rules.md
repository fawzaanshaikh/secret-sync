# Input validation limits

All validated with `zod` at the route layer; violations return `400` with a field-level error map.

| Field | Rule | Where |
|---|---|---|
| username | 3-50 chars | setup, login, create user |
| password | min 8 chars | setup, login, create user |
| role | `admin` or `member` only | create user |
| project name | 1-100 chars | create project |
| branch name | 1-100 chars | create branch |
| required approvals | integer, 1-10 | branch protection |
| env var key | 1-200 chars | env var changes |
| change action | `add` / `update` / `delete` only | env var changes |
| review decision | `approve` / `reject` only | proposal review |
| review comment | max 500 chars, optional | proposal review |

Notes:
- Usernames must be unique; duplicate create attempts return `409`.
- There's no max length enforced on env var values.
