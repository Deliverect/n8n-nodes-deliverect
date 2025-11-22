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

## Version history

v1.0: Initial version

