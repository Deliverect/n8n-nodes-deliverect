import type { INodeProperties } from 'n8n-workflow';

const accountOperations: string[] = [
	'getStores',
	'setOutOfStock',
	'getProductCategories',
	'getStoreOpeningHours',
	'getProductsForAccount',
];

const locationOperations: string[] = [
	'productSync',
	'getOutOfStock',
	'setStoreStatus',
	'setOutOfStock',
	'getStoreHolidays',
];

const fetchFullPayloadOperations: string[] = [
	'getOutOfStock',
	'getProductsForAccount',
	'getStoreOpeningHours',
	'getStores',
	'getAllAllergens',
	'getProductCategories',
];

export const fetchFullPayloadField: INodeProperties = {
	displayName: 'Fetch Full Payload',
	name: 'fetchFullPayload',
	type: 'boolean',
	default: false,
	description: 'Whether to disable projection and return full API responses',
	displayOptions: {
		show: {
			resource: ['storeAPI', 'posAPI'],
			operation: fetchFullPayloadOperations,
		},
	},
};

export const accountField: INodeProperties = {
	displayName: 'Account ID',
	name: 'account',
	type: 'string',
	required: true,
	default: '',
	displayOptions: {
		show: {
			resource: ['posAPI', 'storeAPI'],
			operation: accountOperations,
		},
	},
};

export const locationIdField: INodeProperties = {
	displayName: 'Filter by Location ID',
	name: 'locationId',
	type: 'string',
	default: '',
	description: 'Optional location ID to scope products to a single store',
	displayOptions: {
		show: {
			resource: ['storeAPI'],
			operation: ['getProductsForAccount'],
		},
	},
};

export const locationField: INodeProperties = {
	displayName: 'Location ID',
	name: 'location',
	type: 'string',
	required: true,
	default: '',
	displayOptions: {
		show: {
			resource: ['posAPI', 'storeAPI'],
			operation: locationOperations,
		},
	},
};
