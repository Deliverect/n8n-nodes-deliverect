import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const userOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Get My Profile',
		value: 'getMyProfile',
		action: 'Get my profile',
		description:
			'Retrieve the authenticated user profile',
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

