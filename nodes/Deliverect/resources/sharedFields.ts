import type { INodeProperties } from 'n8n-workflow';

const accountOperations: string[] = [
	'getStores',
	'setOutOfStock',
	'productSync',
	'getProductCategories',
	'getStoreOpeningHours',
	'requestProductSync',
	'getProductsMarkedOutOfStock',
	'updateProductAvailabilityByPlu',
	'markProductsOutOfStockByTag',
] as const;

const locationOperations: string[] = [
	'productSync',
	'getOutOfStock',
	'getProductCategories',
	'setStoreStatus',
	'setOutOfStock',
	'requestProductSync',
	'markProductsOutOfStockByTag',
	'updateProductAvailabilityByPlu',
	'updateStoreStatusPrepTime',
] as const;

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

