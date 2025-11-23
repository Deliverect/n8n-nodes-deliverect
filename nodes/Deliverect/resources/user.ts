import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const userOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Get My Account',
		value: 'getOwnAccount',
		action: 'Get my account',
		description: 'Retrieve the account associated with the authenticated API user',
		routing: {
			request: {
				method: 'GET',
				url: '=/users/validate',
			},
		},
	},
];

export const userResource: DeliverectResourceModule = {
	resource: 'userAPI',
	operations: createOperationsProperty('userAPI', userOperationOptions, 'getOwnAccount'),
};

