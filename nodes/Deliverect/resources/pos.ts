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
		name: 'Insert/Update Products',
		value: 'insertUpdateProducts',
		action: 'Insert update products',
		description:
			'Create, update, or delete products and categories for a location. Products not included in the payload will be deleted unless forceUpdate is disabled.',
		routing: {
			request: {
				method: 'POST',
				url: '/productAndCategories',
				qs: {
					previewSync: '={{$parameter.previewSync ? true : undefined}}',
					forceUpdate: '={{$parameter.forceUpdate === false ? false : undefined}}',
				},
				body: buildJsonParsingExpression({
					paramName: 'productsPayload',
					fieldLabel: 'Products',
					postProcess: `if (typeof result !== 'object' || result === null || Array.isArray(result)) {
	throw new Error('Products payload must be a JSON object containing accountId, locationId, and products array');
}
if (!result.accountId || !result.locationId) {
	throw new Error('Products payload must include accountId and locationId');
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
		displayName: 'Products Payload',
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
			'JSON payload for product sync. Must include <code>accountId</code>, <code>locationId</code>, and a <code>products</code> array. ' +
			'<br /><strong>Product fields:</strong>' +
			'<ul>' +
			'<li><code>productType</code>: 1 (product), 2 (modifier), 3 (modifier group), 4 (bundle)</li>' +
			'<li><code>plu</code>: Unique product identifier</li>' +
			'<li><code>name</code>: Product name</li>' +
			'<li><code>price</code>: Price in cents</li>' +
			'<li><code>tax</code>: Tax percentage</li>' +
			'<li><code>description</code>: Optional product description</li>' +
			'<li><code>imageUrl</code>: Optional image URL</li>' +
			'<li><code>subProducts</code>: Array of PLUs for modifiers/combos</li>' +
			'</ul>' +
			'Products omitted from payload will be deleted. Use Preview Sync to test changes first.',
		displayOptions: {
			show: {
				resource: ['posAPI'],
				operation: ['insertUpdateProducts'],
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
				operation: ['insertUpdateProducts'],
			},
		},
	},
	{
		displayName: 'Force Update',
		name: 'forceUpdate',
		type: 'boolean',
		default: true,
		description:
			'Whether to allow deletion of more than 30% of existing products. When disabled (false), the sync will abort if too many products would be deleted.',
		displayOptions: {
			show: {
				resource: ['posAPI'],
				operation: ['insertUpdateProducts'],
			},
		},
	},
];

export const posResource: DeliverectResourceModule = {
	resource: 'posAPI',
	operations: createOperationsProperty('posAPI', posOperationOptions, 'insertUpdateProducts'),
	fields: posSpecificFields,
};
