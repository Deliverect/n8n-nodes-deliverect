import {
	buildProjectionExpression,
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const posOperationOptions: DeliverectOperationOption[] = [
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
];

export const posResource: DeliverectResourceModule = {
	resource: 'posAPI',
	operations: createOperationsProperty('posAPI', posOperationOptions, 'productSync'),
	fields: [],
};
