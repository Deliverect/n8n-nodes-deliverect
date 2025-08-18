import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class Deliverect implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Deliverect',
		name: 'deliverect',
		icon: 'file:deliverect.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume Deliverect API',
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		defaults: {
			name: 'Deliverect',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'deliverectApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '=https://{{$credentials.domain}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Channel API',
						value: 'channelAPI',
					},
					{
						name: 'KDS API',
						value: 'kdsAPI',
					},
					{
						name: 'POS API',
						value: 'posAPI',
					},
					{
						name: 'REST API',
						value: 'restAPI',
					},
					{
						name: 'Store API',
						value: 'storeAPI',
					},
				],
				default: 'storeAPI',
			},
			// Operations will go here
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['storeAPI'],
					},
				},
				options: [
					{
						name: 'Get Out-Of-Stock Products',
						value: 'getOutOfStock',
						action: 'Get out of stock products',
						description: 'Get out-of-stock products for a location',
						routing: {
							request: {
								method: 'GET',
								url: '=/channelDisabledProducts?where={"location":"{{$parameter.location}}"}',
							},
						},
					},
					{
						name: 'Get Store Holidays',
						value: 'getStoreHolidays',
						action: 'Get store holidays',
						routing: {
							request: {
								method: 'GET',
								url: '=/locations/holidays',
							},
						},
					},
					{
						name: 'Get Store Opening Hours',
						value: 'getStoreOpeningHours',
						action: 'Get store opening hours',
						routing: {
							request: {
								method: 'GET',
								url: '=/account/{{$parameter.account}}/openingHours',
							},
						},
					},
					{
						name: 'Get Stores',
						value: 'getStores',
						action: 'Get stores',
						description: 'Get stores for an account',
						routing: {
							request: {
								method: 'GET',
								url: '=/locations?where={"account":"{{$parameter.account}}"}',
							},
						},
					},
					{
						name: 'Set Out-Of-Stock Products',
						value: 'setOutOfStock',
						action: 'Set out of stock products',
						description: 'Set out-of-stock products for a location',
						routing: {
							request: {
								method: 'POST',
								url: '/products/snoozeByPlus',
								body: {
									account: '={{$parameter.account}}',
									location: '={{$parameter.location}}',
									plus: '={{ $parameter.products }}',
								},
							},
						},
					},
					{
						name: 'Set Store Holidays',
						value: 'setStoreHolidays',
						action: 'Set store holidays',
						routing: {
							request: {
								method: 'POST',
								url: '=/locations/holidays',
								body: '={{ $parameter.holidays }}',
							},
						},
					},
					{
						name: 'Set Store Opening Hours',
						value: 'setStoreOpeningHours',
						action: 'Set store opening hours',
						routing: {
							request: {
								method: 'POST',
								url: '=/locations/openingHours',
								body: '={{ $parameter.openingHours }}',
							},
						},
					},
					{
						name: 'Set Store Status',
						value: 'setStoreStatus',
						action: 'Set store status',
						description: 'Set store status for a location',
						routing: {
							request: {
								method: 'POST',
								url: '=/updateStoreStatus/{{$parameter.location}}',
								body: {
									isActive: '={{$parameter.isActive}}',
									// channelLinks:
									'=disableAt':
										'={{$parameter.disableAt !== "" && $parameter.disableAt !== undefined ? $parameter.disableAt : undefined}}',
								},
							},
						},
					},
				],
				default: 'getStores',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['channelAPI'],
					},
				},
				options: [
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
				],
				default: 'createOrder',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['posAPI'],
					},
				},
				options: [
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
								},
							},
						},
					},
				],
				default: 'productSync',
			},
			// Optional/additional fields will go here
			{
				displayName: 'Account ID',
				name: 'account',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['posAPI', 'storeAPI'],
						operation: [
							'getStores',
							'setOutOfStock',
							'productSync',
							'getProductCategories',
							'getStoreOpeningHours',
						],
					},
				},
			},
			{
				displayName: 'Location ID',
				name: 'location',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['posAPI', 'storeAPI'],
						operation: [
							'productSync',
							'getOutOfStock',
							'getProductCategories',
							'setStoreStatus',
							'setOutOfStock',
						],
					},
				},
			},
			{
				displayName: 'Holidays',
				name: 'holidays',
				type: 'json',
				default: `{"locations": [{"id": "65***********aa56be7b63", "holidays": []}]}`,
				displayOptions: {
					// the resources and operations to display this element with
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreHolidays'],
					},
				},
			},
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
					// the resources and operations to display this element with
					show: {
						resource: ['channelAPI'],
						operation: ['createOrder'],
					},
				},
			},
		],
	};
}
