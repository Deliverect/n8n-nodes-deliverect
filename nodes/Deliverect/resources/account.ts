import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';
import { buildAccountField } from './sharedFields';

const accountOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Get Account',
		value: 'getAccount',
		action: 'Get account',
		description: 'Retrieve a single account by ID',
		needsAccount: true,
		routing: {
			request: {
				method: 'GET',
				url: '=/accounts/{{$parameter.account}}',
			},
		},
	},
];

const accountField = buildAccountField('accountAPI', accountOperationOptions);

export const accountResource: DeliverectResourceModule = {
	resource: 'accountAPI',
	operations: createOperationsProperty('accountAPI', accountOperationOptions, 'getAccount'),
	fields: [accountField],
};

