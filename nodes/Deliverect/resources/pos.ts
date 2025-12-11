import type { INodeProperties } from 'n8n-workflow';
import {
	buildJsonParsingExpression,
	buildProjectionExpression,
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const posOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Get All Allergens',
		value: 'getAllAllergens',
		action: 'Get all allergens',
		description: 'Retrieve all allergens from POSAPI',
		routing: {
			request: {
				method: 'GET',
				url: '/allAllergens',
				qs: {
					projection: buildProjectionExpression({
						_id: 1,
						name: 1,
						tags: 1,
						updatedAt: 1,
					}),
				},
			},
		},
	},
	{
		name: 'Get Product Categories',
		value: 'getProductCategories',
		action: 'Get product categories',
		description: 'Retrieve product categories for a specific account from POSAPI',
		routing: {
			request: {
				method: 'GET',
				url: '/productCategories',
				qs: {
					where: '={{ JSON.stringify({ account: $parameter.account }) }}',
					projection: buildProjectionExpression({
						_id: 1,
						name: 1,
						parent: 1,
						account: 1,
						products: { _id: 1, name: 1 },
					}),
				},
			},
		},
	},
	{
		name: 'Sync Product Catalog',
		value: 'syncProductCatalog',
		action: 'Sync product catalog',
		description:
			'WARNING: This replaces the entire product catalog. Products not included in the payload will be deleted. Products must exist on your POS and are identified by their PLU. By default, syncs that would delete more than 30% of products are rejected—enable Force Update to bypass this protection.',
		routing: {
			request: {
				method: 'POST',
				url: '/productAndCategories',
				qs: {
					previewSync: '={{$parameter.previewSync ? true : undefined}}',
					forceUpdate: '={{$parameter.forceUpdate === true ? true : undefined}}',
				},
				body: buildJsonParsingExpression({
					paramName: 'productsPayload',
					fieldLabel: 'Products',
					postProcess: `if (typeof result !== 'object' || result === null || Array.isArray(result)) {
	throw new Error('Products payload must be a JSON object containing accountId, locationId, and products array');
}
if (!result.accountId || typeof result.accountId !== 'string' || result.accountId.trim() === '') {
	throw new Error('Products payload must include a non-empty accountId');
}
if (!result.locationId || typeof result.locationId !== 'string' || result.locationId.trim() === '') {
	throw new Error('Products payload must include a non-empty locationId');
}
if (!Array.isArray(result.products)) {
	throw new Error('Products payload must include a products array');
}
return result;`,
				}),
			},
		},
	},
	{
		name: 'Request Product Sync',
		value: 'productSync',
		action: 'Request product sync',
		description: 'Trigger Deliverect to sync products for a POS on a specific location',
		routing: {
			request: {
				method: 'POST',
				url: '=/v2/locations/{{$parameter.location}}/syncProducts',
			},
		},
	},
];

const posSpecificFields: INodeProperties[] = [
	{
		displayName: 'Product Catalog Payload',
		name: 'productsPayload',
		type: 'json',
		required: true,
		default: `{
	"accountId": "",
	"locationId": "",
	"products": [
		{
			"productType": 1,
			"plu": "PRODUCT-001",
			"name": "Sample Product",
			"price": 999,
			"tax": 6
		}
	],
	"categories": []
}`,
		description:
			'<strong>Warning:</strong> This is a full catalog sync. Products omitted from this payload will be deleted. Use Preview Sync to test changes first.' +
			'<br /><br />JSON payload containing your complete product catalog. Must include <code>accountId</code>, <code>locationId</code>, and a <code>products</code> array. ' +
			'<br /><strong>Product fields:</strong>' +
			'<ul>' +
			'<li><code>productType</code>: 1 (product), 2 (modifier), 3 (modifier group), 4 (bundle)</li>' +
			'<li><code>plu</code>: Unique product identifier (must match the PLU on your POS system)</li>' +
			'<li><code>name</code>: Product name</li>' +
			'<li><code>price</code>: Price in cents</li>' +
			'<li><code>tax</code>: Tax percentage</li>' +
			'<li><code>description</code>: Optional product description</li>' +
			'<li><code>imageUrl</code>: Optional image URL</li>' +
			'<li><code>subProducts</code>: Array of PLUs for modifiers/combos</li>' +
			'</ul>',
		displayOptions: {
			show: {
				resource: ['posAPI'],
				operation: ['syncProductCatalog'],
			},
		},
	},
	{
		displayName: 'Preview Sync',
		name: 'previewSync',
		type: 'boolean',
		default: false,
		description:
			'Whether to preview the sync without applying changes. Returns counts of products that would be created, updated, or deleted.',
		displayOptions: {
			show: {
				resource: ['posAPI'],
				operation: ['syncProductCatalog'],
			},
		},
	},
	{
		displayName: 'Force Update',
		name: 'forceUpdate',
		type: 'boolean',
		default: false,
		description:
			'Whether to force the update by bypassing the 30% deletion protection safeguard. When set to false (the default), the sync will abort if >30% of products would be deleted. When set to true, all deletions are allowed regardless of percentage.',
		displayOptions: {
			show: {
				resource: ['posAPI'],
				operation: ['syncProductCatalog'],
			},
		},
	},
];

export const posResource: DeliverectResourceModule = {
	resource: 'posAPI',
	operations: createOperationsProperty('posAPI', posOperationOptions, 'syncProductCatalog'),
	fields: posSpecificFields,
};
