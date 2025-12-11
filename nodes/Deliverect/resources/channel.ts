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
		description:
			'The order data to send as JSON. <br />' +
			'<strong>Required fields:</strong> <ul>' +
			'<li><code>posLocationId</code> (string): The POS location ID for the order.</li>' +
			'<li><code>items</code> (array): List of order items. Each item should include at least <code>plu</code> (string, must match the product identifier on your POS), <code>quantity</code> (number), and <code>price</code> (number).</li>' +
			'</ul>' +
			'<strong>Example:</strong><pre>{\\n  "posLocationId": "12345",\\n  "items": [\\n    {\\n      "plu": "1001",\\n      "quantity": 2,\\n      "price": 9.99,\\n      "name": "Pizza Margherita"\\n    },\\n    {\\n      "plu": "1002",\\n      "quantity": 1,\\n      "price": 4.99,\\n      "name": "Soft Drink"\\n    }\\n  ]\\n}</pre>',
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
