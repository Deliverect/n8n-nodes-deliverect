import {
	createOperationsProperty,
	jsonExpression,
	jsonProjection,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';
import { buildAccountField, buildLocationField } from './sharedFields';

const posOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Sync POS Products',
		value: 'productSync',
		action: 'Sync POS products',
		description: 'Sync products for a location',
		needsAccount: true,
		needsLocation: true,
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
					projection: jsonProjection(['_id', 'name', 'tags', 'updatedAt']),
				},
			},
		},
	},
	{
		name: 'Get Product Categories',
		value: 'getProductCategories',
		action: 'Get product categories',
		description: 'Retrieve product categories for a specific account from POSAPI',
		needsAccount: true,
		needsLocation: true,
		routing: {
			request: {
				method: 'GET',
				url: '/productCategories',
				qs: {
					where: jsonExpression('{ account: $parameter.account }'),
					projection: jsonProjection([
						'_id',
						'name',
						'parent',
						'account',
						'products._id',
						'products.name',
					]),
				},
			},
		},
	},
];

const posAccountField = buildAccountField('posAPI', posOperationOptions);
const posLocationField = buildLocationField('posAPI', posOperationOptions);

export const posResource: DeliverectResourceModule = {
	resource: 'posAPI',
	operations: createOperationsProperty('posAPI', posOperationOptions, 'productSync'),
	fields: [posAccountField, posLocationField],
};

