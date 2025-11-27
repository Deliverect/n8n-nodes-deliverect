import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

function buildJsonParsingExpression({
	paramName,
	fieldLabel,
	allowUndefined = false,
	trimEmptyStringToUndefined = false,
	postProcess,
}: {
	paramName: string;
	fieldLabel: string;
	allowUndefined?: boolean;
	trimEmptyStringToUndefined?: boolean;
	postProcess?: string;
}) {
	const undefinedReturn = allowUndefined ? 'return undefined;' : 'return payload;';
	const emptyStringCondition = trimEmptyStringToUndefined
		? " || (typeof payload === 'string' && payload.trim() === '')"
		: '';
	const postProcessBlock = postProcess ?? 'return result;';

	return `={{ (() => {
	const payload = $parameter.${paramName};
	if (payload === undefined || payload === null${emptyStringCondition}) {
		${undefinedReturn}
	}
	let result = payload;
	if (typeof result === 'string') {
		try {
			result = JSON.parse(result);
		} catch (error) {
			const message = error && error.message ? error.message : error;
			throw new Error(\`Invalid JSON provided for ${fieldLabel} payload: \${message}\`);
		}
	}
	${postProcessBlock}
})() }}`;
}

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
		inputs: ['main'],
		outputs: ['main'],
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
								url: '=/location/{{$parameter.location}}/holidays',
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
									plus: '={{$parameter.products}}',
									snoozeStart: '={{$parameter.snoozeStart}}',
									snoozeEnd: '={{$parameter.snoozeEnd}}',
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
								body: buildJsonParsingExpression({
									paramName: 'holidays',
									fieldLabel: 'Holidays',
								}),
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
								body: buildJsonParsingExpression({
									paramName: 'openingHours',
									fieldLabel: 'Opening Hours',
								}),
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
									channelLinks: buildJsonParsingExpression({
										paramName: 'channelLinks',
										fieldLabel: 'Channel Links',
										allowUndefined: true,
										trimEmptyStringToUndefined: true,
										postProcess: `if (!Array.isArray(result)) {
	return undefined;
}
return result.length ? result : undefined;`,
									}),
									prepTime:
										'={{$parameter.prepTime !== null && $parameter.prepTime !== undefined ? $parameter.prepTime : undefined}}',
									disableAt:
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
							'getStoreHolidays',
						],
					},
				},
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the store (or targeted channels) should be available online',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreStatus'],
					},
				},
			},
			{
				displayName: 'Channel Links',
				name: 'channelLinks',
				type: 'json',
				default: '[]',
				description: 'Optional array of channel link IDs to update; leave as empty array (`[]`) to target the whole location. Example: ["channelId1", "channelId2"].',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreStatus'],
					},
				},
			},
			{
				displayName: 'Preparation Time (Minutes)',
				name: 'prepTime',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 60,
				},
				default: null,
				description: 'Optional override for the preparation time applied to the entire location',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreStatus'],
					},
				},
			},
			{
				displayName: 'Auto Reactivate At',
				name: 'disableAt',
				type: 'string',
				default: '',
				description: 'Optional ISO 8601 timestamp after which Deliverect reactivates the store automatically',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreStatus'],
					},
				},
			},
			{
				displayName: 'Product PLUs',
				name: 'products',
				type: 'json',
				default: '[]',
				required: true,
				description: 'JSON array of PLU identifiers to snooze. For example: ["PLU123", "PLU456"].',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setOutOfStock'],
					},
				},
			},
			{
				displayName: 'Snooze Start',
				name: 'snoozeStart',
				type: 'dateTime',
				required: true,
				default: '',
				description: 'ISO 8601 UTC timestamp indicating when snoozing starts (typically now)',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setOutOfStock'],
					},
				},
			},
			{
				displayName: 'Snooze End',
				name: 'snoozeEnd',
				type: 'dateTime',
				required: true,
				default: '',
				description: 'ISO 8601 UTC timestamp indicating when products become available again; must be in the future when snoozing, in the past to un-snooze',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setOutOfStock'],
					},
				},
			},
			{
				displayName: 'Holidays',
				name: 'holidays',
				type: 'json',
				default: `{
	"locations": [
		{
			"id": "65***********aa56be7b63",
			"holidays": [
				{
					"startTime": "2023-12-24T15:00:00",
					"endTime": "2023-12-25T02:00:00"
				}
			]
		}
	]
}`,
				required: true,
				description:
					'JSON body describing holidays to send to Deliverect. Times must be expressed in the store’s local time zone (no trailing Z).',
				displayOptions: {
					// the resources and operations to display this element with
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreHolidays'],
					},
				},
			},
			{
				displayName: 'Opening Hours Payload',
				name: 'openingHours',
				type: 'json',
				default: `{
	"locations": [
		{
			"id": "65***********aa56be7b63",
			"triggerUpdate": false,
			"openingHours": [
				{
					"dayOfWeek": 1,
					"startTime": "10:00",
					"endTime": "22:00"
				}
			],
			"channels": [
				{
					"id": "62***********fd1f",
					"openingHours": [
						{
							"dayOfWeek": 1,
							"startTime": "08:00",
							"endTime": "20:00"
						}
					]
				}
			]
		}
	]
}`,
				required: true,
				description: 'JSON body describing the opening hours to send to Deliverect',
				displayOptions: {
					show: {
						resource: ['storeAPI'],
						operation: ['setStoreOpeningHours'],
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
