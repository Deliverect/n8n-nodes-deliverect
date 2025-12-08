import type { INodeProperties } from 'n8n-workflow';
import {
	buildJsonParsingExpression,
	buildProjectionExpression,
	createOperationsProperty,
	deliverectPagination,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';

const storeOperationOptions: DeliverectOperationOption[] = [
	{
		name: 'Get Out-Of-Stock Products',
		value: 'getOutOfStock',
		action: 'Get out of stock products',
		description: 'Get out-of-stock products for a location',
		routing: {
			request: {
				method: 'GET',
				url: '=/channelDisabledProducts',
				qs: {
					where: '={{ JSON.stringify({ location: $parameter.location }) }}',
					projection: buildProjectionExpression({
						_id: 1,
						location: 1,
						channelLink: 1,
						plus: 1,
						channel: 1,
						disabledUntil: 1,
						createdAt: 1,
						updatedAt: 1,
					}),
				},
			},
		},
	},
	{
		name: 'Get Products for Account',
		value: 'getProductsForAccount',
		action: 'Get products for account',
		description: 'Retrieve products for an entire account or a single location',
		routing: {
			request: {
				method: 'GET',
				url: '=/products',
				qs: {
					where:
						'={{ JSON.stringify($parameter.locationId ? { account: $parameter.account, location: $parameter.locationId } : { account: $parameter.account }) }}',
					projection: buildProjectionExpression({
						_id: 1,
						account: 1,
						location: 1,
						name: 1,
						plu: 1,
						channelLinks: 1,
						tags: 1,
						updatedAt: 1,
					}),
				},
			},
			operations: {
				pagination: deliverectPagination,
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
				qs: {
					projection: buildProjectionExpression({
						account: 1,
						location: 1,
						timezone: 1,
						days: 1,
						openingHours: 1,
					}),
				},
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
				url: '=/locations',
				qs: {
					where: '={{ JSON.stringify({ account: $parameter.account }) }}',
					projection: buildProjectionExpression({
						_id: 1,
						account: 1,
						name: 1,
						posLocationId: 1,
						channelLinks: 1,
						timezone: 1,
						isActive: 1,
						updatedAt: 1,
					}),
				},
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
					plus: buildJsonParsingExpression({
						paramName: 'products',
						fieldLabel: 'Product PLUs',
						postProcess: `if (!Array.isArray(result)) {
	throw new Error('Product PLUs payload must be an array');
}
return result;`,
					}),
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
];

const storeSpecificFields: INodeProperties[] = [
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
		description:
			'Optional array of channel link IDs to update; leave as empty array (`[]`) to target the whole location. Example: ["channelId1", "channelId2"].',
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
		description:
			'Optional ISO 8601 timestamp after which Deliverect reactivates the store automatically',
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
		description:
			'ISO 8601 UTC timestamp indicating when products become available again; must be in the future when snoozing, in the past to un-snooze',
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
			"JSON body describing holidays to send to Deliverect. Times must be expressed in the store's local time zone (no trailing Z).",
		displayOptions: {
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
];

export const storeResource: DeliverectResourceModule = {
	resource: 'storeAPI',
	operations: createOperationsProperty('storeAPI', storeOperationOptions, 'getStores'),
	fields: storeSpecificFields,
};
