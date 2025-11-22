import type { INodeProperties } from 'n8n-workflow';
import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const commerceOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Checkout Basket',
		value: 'checkoutBasket',
		action: 'Checkout basket',
		description: 'Perform checkout for a basket',
		routing: {
			request: {
				method: 'POST',
				url: '=/commerce/baskets/{{$parameter.basketId}}/checkout',
				body: '={{ $parameter.checkoutPayload }}',
			},
		},
	},
	{
		name: 'Create Basket',
		value: 'createBasket',
		action: 'Create basket',
		description: 'Create a new commerce basket',
		internal: true,
		routing: {
			request: {
				method: 'POST',
				url: '=/commerce/baskets',
				body: '={{ $parameter.basketPayload }}',
			},
		},
	},
	{
		name: 'Get Basket',
		value: 'getBasket',
		action: 'Get basket',
		description: 'Retrieve an existing basket',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/baskets/{{$parameter.basketId}}',
			},
		},
	},
	{
		name: 'Get Checkout',
		value: 'getCheckout',
		action: 'Get checkout',
		description: 'Retrieve an existing checkout by ID',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/checkouts/{{$parameter.checkoutId}}',
			},
		},
	},
	{
		name: 'Get Commerce Store',
		value: 'getCommerceStore',
		action: 'Get commerce store',
		description: 'Retrieve a single commerce store by ID',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/stores/{{$parameter.storeId}}',
			},
		},
	},
	{
		name: 'Get Commerce Stores',
		value: 'getCommerceStores',
		action: 'Get commerce stores',
		description: 'List stores available through the Commerce API',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/stores',
			},
		},
	},
	{
		name: 'Get Root Menus',
		value: 'getRootMenus',
		action: 'Get root menus',
		description: 'List root menus for a commerce store',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/stores/{{$parameter.storeId}}/rootMenus',
			},
		},
	},
	{
		name: 'Get Store Menus',
		value: 'getStoreMenus',
		action: 'Get store menus',
		description: 'List store menus (including nested menus) for a commerce store',
		routing: {
			request: {
				method: 'GET',
				url: '=/commerce/stores/{{$parameter.storeId}}/menus',
				qs: {
					depth: '={{ $parameter.menuDepth ? $parameter.menuDepth : undefined }}',
				},
			},
		},
	},
	{
		name: 'Patch Basket',
		value: 'patchBasket',
		action: 'Patch basket',
		description: 'Update an existing basket',
		routing: {
			request: {
				method: 'PATCH',
				url: '=/commerce/baskets/{{$parameter.basketId}}',
				body: '={{ $parameter.basketPatchPayload }}',
			},
		},
	},
];

const commerceFields: INodeProperties[] = [
	{
		displayName: 'Store ID',
		name: 'storeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['getCommerceStore', 'getRootMenus', 'getStoreMenus'],
			},
		},
	},
	{
		displayName: 'Menu Depth',
		name: 'menuDepth',
		type: 'number',
		default: 0,
		description: 'Optional depth parameter for store menu queries',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['getStoreMenus'],
			},
		},
	},
	{
		displayName: 'Basket ID',
		name: 'basketId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['patchBasket', 'getBasket', 'checkoutBasket'],
			},
		},
	},
	{
		displayName: 'Basket Payload',
		name: 'basketPayload',
		type: 'json',
		default: `{"storeId": "", "items": []}`,
		description: 'Full payload to create a basket',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['createBasket'],
			},
		},
	},
	{
		displayName: 'Basket Patch Payload',
		name: 'basketPatchPayload',
		type: 'json',
		default: `{"items": []}`,
		description: 'Payload used when patching a basket',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['patchBasket'],
			},
		},
	},
	{
		displayName: 'Checkout Payload',
		name: 'checkoutPayload',
		type: 'json',
		default: `{"customer": {}, "payments": []}`,
		description: 'Payload for performing a checkout on a basket',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['checkoutBasket'],
			},
		},
	},
	{
		displayName: 'Checkout ID',
		name: 'checkoutId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['commerceAPI'],
				operation: ['getCheckout'],
			},
		},
	},
];

export const commerceResource: DeliverectResourceModule = {
	resource: 'commerceAPI',
	operations: createOperationsProperty('commerceAPI', commerceOperationOptions, 'getCommerceStores'),
	fields: commerceFields,
};

