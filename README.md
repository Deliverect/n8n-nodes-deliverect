# n8n-nodes-deliverect

This is an n8n community node. It lets you use [Deliverect](https://developers.deliverect.com/) in your n8n workflows.


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Usage](#usage)
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

**Store API**

- Get stores, opening hours, and holidays
- Set store opening hours/holidays
- Set store status or busy mode (with optional prep-time updates)
- Request product syncs
- Get or update snoozed/out-of-stock products by PLU or tag

**POS API**

- Sync products
- Get all allergens
- Get product categories

**Commerce API**

- List commerce stores, single store details, root menus, and store menus
- Create, patch, retrieve, and checkout baskets
- Retrieve checkouts

**Channel API**

- Create orders (channel push)

**User API**

- Retrieve the authenticated user's account metadata (useful for discovering the correct Account ID)

## Credentials

[Request](https://developers.deliverect.com/docs/getting-started) a client credentials keypair with Deliverect API support.

Bearer token support is WIP.

## Compatibility

Tested with N8N 1.97.1

## Usage

If you're new with N8N, [try it out](https://docs.n8n.io/try-it-out/) first.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Deliverect API documentation](https://developers.deliverect.com)

## Maintainer Notes

- Each API resource definition lives in `nodes/Deliverect/resources/<resource>.ts`. These files bundle the operation list plus any fields scoped to that resource. Update the relevant file instead of editing the main node.
- Shared request defaults and helpers (such as automatic \"(Internal)\" labelling for advanced operations) live in `nodes/Deliverect/helpers.ts`.
- To add a new internal-only action, set `internal: true` on the corresponding option; the helper will add a warning suffix and description so the UI clearly distinguishes it.

## Development

1. Use Node.js 20 or newer (the package targets modern LTS releases).
2. Install dependencies with `npm install`.

### Common scripts

- `npm run dev` — `tsc --watch` for iterative TypeScript builds (pair it with `n8n-node-dev` for hot-reload-style workflows).
- `npm run clean` — Remove the compiled `dist` folder.
- `npm run build` — Clean, compile TypeScript, and copy static assets.
- `npm run lint` — Run ESLint (includes the n8n node rules).
- `npm run lint:ci` — Same lint suite but fails on warnings; ideal for CI.
- `npm run lintfix` — Run the lint suite with `--fix`.
- `npm run format` — Apply Prettier to `nodes/` and `credentials/`.

### Local n8n testing

1. Run `npm run build` once (or keep `npm run dev` running for incremental builds).
2. Link the package with `n8n-node-dev link` (or install the generated tarball inside your n8n instance).
3. Restart n8n and verify the Deliverect nodes appear under community nodes.
4. Use `n8n-node-dev build` to rebuild + relink quickly while iterating on node resources.

### Contributing workflow

1. Branch off `master` (e.g., `feat/add-commerce-action`).
2. Implement the change with `npm run dev` and add tests/docs as needed.
3. Run `npm run lintfix && npm run format` to apply auto-fixes.
4. Make sure `npm run lint:ci && npm run build` both pass before opening a PR.
5. Update README + changelog entries when behaviour or UX changes.

### Webhook raw body requirement

`DeliverectTrigger` verifies HMAC signatures against the *raw* request body. In your n8n workflow:

1. Enable \"Keep Raw Data\" in the webhook node.
2. Avoid pre-processing nodes that mutate the request body before the trigger executes.
3. Share the resulting webhook URL + secret with Deliverect so they can test the signature flow.

Without the raw payload, webhook calls will be rejected as unverified (you will see `Invalid HMAC signature` errors).

### Release checklist

1. Update `CHANGELOG.md` via `npx auto-changelog -p`.
2. Bump the version in `package.json`.
3. Run `npm run lint:ci`, `npm run build`, and `npm publish --dry-run`.
4. Push the branch/tag and wait for CI to pass across the Node matrix.
5. Publish with `npm publish` once CI is green.

## Version history

v1.0: Initial version

