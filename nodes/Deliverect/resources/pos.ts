import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';
import { accountField, locationField } from './sharedFields';

const posOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Sync POS Products',
		value: 'productSync',
		action: 'Sync POS products',
		description: 'Sync products for a location',
		routing: {
			request: {
				method: 'POST',
				url: '/productAndCategories',
			},
		},
	},
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
					projection: '={{ JSON.stringify({ _id: 1, name: 1, tags: 1, updatedAt: 1 }) }}',
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
					projection:
						'={{ JSON.stringify({ _id: 1, name: 1, parent: 1, account: 1, "products._id": 1, "products.name": 1 }) }}',
				},
			},
		},
	},
];

export const posResource: DeliverectResourceModule = {
	resource: 'posAPI',
	operations: createOperationsProperty('posAPI', posOperationOptions, 'productSync'),
	fields: [accountField, locationField],
};

