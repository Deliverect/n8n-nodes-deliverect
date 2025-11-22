import type { INodeProperties } from 'n8n-workflow';
import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const channelOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Create Order',
		value: 'createOrder',
		action: 'Create order',
		description: 'Create an order to a store',
		routing: {
			request: {
				method: 'POST',
				url: '=/deliverect/order/{{$parameter.channelLink}}',
			},
		},
	},
];

const channelFields: INodeProperties[] = [
	{
		displayName: 'Store ID',
		description: 'The ID of the store (channelLink)',
		name: 'channelLink',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['channelAPI'],
				operation: ['createOrder'],
			},
		},
	},
	{
		displayName: 'Order Data',
		name: 'orderData',
		type: 'json',
		default: `{"posLocationId": "", "items": []}`,
		displayOptions: {
			show: {
				resource: ['channelAPI'],
				operation: ['createOrder'],
			},
		},
	},
];

export const channelResource: DeliverectResourceModule = {
	resource: 'channelAPI',
	operations: createOperationsProperty('channelAPI', channelOperationOptions, 'createOrder'),
	fields: channelFields,
};
