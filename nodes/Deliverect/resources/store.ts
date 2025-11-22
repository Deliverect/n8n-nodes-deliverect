import type { INodeProperties } from 'n8n-workflow';
import {
	createOperationsProperty,
	type DeliverectOperationOption,
	type DeliverectResourceModule,
} from '../helpers';
import { accountField, locationField } from './sharedFields';

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
					projection:
						'={{ JSON.stringify({ _id: 1, location: 1, channelLink: 1, plus: 1, channel: 1, disabledUntil: 1, createdAt: 1, updatedAt: 1 }) }}',
				},
			},
		},
	},
	{
		name: 'Get Products Marked Out Of Stock',
		value: 'getProductsMarkedOutOfStock',
		action: 'Get products marked out of stock',
		description: 'Retrieve products currently snoozed for an account (optionally by location)',
		routing: {
			request: {
				method: 'GET',
				url: '=/products/markedOutOfStock',
				qs: {
					where:
						'={{ JSON.stringify($parameter.locationOptional !== "" ? { account: $parameter.account, location: $parameter.locationOptional } : { account: $parameter.account }) }}',
					projection:
						'={{ JSON.stringify({ _id: 1, account: 1, location: 1, plus: 1, snoozeStart: 1, snoozeEnd: 1, createdAt: 1 }) }}',
				},
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
				qs: {
					projection: '={{ JSON.stringify({ id: 1, name: 1, holidays: 1, timezone: 1 }) }}',
				},
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
					projection:
						'={{ JSON.stringify({ account: 1, location: 1, timezone: 1, days: 1, openingHours: 1 }) }}',
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
					projection:
						'={{ JSON.stringify({ _id: 1, account: 1, name: 1, posLocationId: 1, address: 1, channelLinks: 1, timezone: 1, isActive: 1 }) }}',
				},
			},
		},
	},
	{
		name: 'Mark Products Out Of Stock by Tag',
		value: 'markProductsOutOfStockByTag',
		action: 'Mark products out of stock by tag',
		description: 'Snooze tagged products for a time window',
		routing: {
			request: {
				method: 'POST',
				url: '=/products/snoozeByTags',
				body: {
					account: '={{ $parameter.account }}',
					location: '={{ $parameter.location }}',
					tags: '={{ $parameter.tagIds }}',
					snoozeStart: '={{ $parameter.snoozeStart }}',
					snoozeEnd: '={{ $parameter.snoozeEnd }}',
				},
			},
		},
	},
	{
		name: 'Request Product Sync',
		value: 'requestProductSync',
		action: 'Request product sync',
		description: 'Trigger a product sync for a location',
		routing: {
			request: {
				method: 'POST',
				url: '=/locations/requestProductSync',
				body: {
					account: '={{ $parameter.account }}',
					location: '={{ $parameter.location }}',
					force: '={{ $parameter.forceSync ? true : undefined }}',
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
					channelLinks: '={{ $parameter.channelLinks }}',
					'=disableAt':
						'={{$parameter.disableAt !== "" && $parameter.disableAt !== undefined ? $parameter.disableAt : undefined}}',
				},
			},
		},
	},
	{
		name: 'Update Product Availability by PLU',
		value: 'updateProductAvailabilityByPlu',
		action: 'Update product availability by PLU',
		description: 'Snooze or unsnooze products for a time window using PLUs',
		routing: {
			request: {
				method: 'POST',
				url: '=/products/availabilityByPlu',
				body: {
					account: '={{ $parameter.account }}',
					location: '={{ $parameter.location }}',
					plus: '={{ $parameter.products }}',
					snoozeStart: '={{ $parameter.snoozeStart }}',
					snoozeEnd: '={{ $parameter.snoozeEnd }}',
				},
			},
		},
	},
	{
		name: 'Update Store Status + Prep Time',
		value: 'updateStoreStatusPrepTime',
		action: 'Update store status and prep time',
		description: 'Set busy mode and preparation time (optionally per channel link)',
		routing: {
			request: {
				method: 'POST',
				url: '=/updateStoreStatusPrepTime/{{$parameter.location}}',
				body: {
					isActive: '={{ $parameter.isActive }}',
					'=disableAt':
						'={{$parameter.disableAt !== "" && $parameter.disableAt !== undefined ? $parameter.disableAt : undefined}}',
					prepTime: '={{ $parameter.prepTime || undefined }}',
					channelLinks: '={{ $parameter.channelLinks }}',
				},
			},
		},
	},
];

const storeSpecificFields: INodeProperties[] = [
	{
		displayName: 'Location ID (Optional)',
		name: 'locationOptional',
		type: 'string',
		default: '',
		description: 'Provide to limit the query to a specific location',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['getProductsMarkedOutOfStock'],
			},
		},
	},
	{
		displayName: 'Product PLUs',
		name: 'products',
		type: 'json',
		default: `["PLU123"]`,
		description: 'Array of PLU codes to target',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['setOutOfStock', 'updateProductAvailabilityByPlu'],
			},
		},
	},
	{
		displayName: 'Force Sync',
		name: 'forceSync',
		type: 'boolean',
		default: false,
		description: 'Whether to force the product sync even if it would overwrite changes in Deliverect',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['requestProductSync'],
			},
		},
	},
	{
		displayName: 'Snooze Start (UTC)',
		name: 'snoozeStart',
		type: 'string',
		default: '',
		placeholder: '2025-11-22T08:00:00Z',
		description: 'Start of the snooze window (ISO8601 UTC). Leave empty to use now.',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['updateProductAvailabilityByPlu', 'markProductsOutOfStockByTag'],
			},
		},
	},
	{
		displayName: 'Snooze End (UTC)',
		name: 'snoozeEnd',
		type: 'string',
		default: '',
		placeholder: '2025-11-22T12:00:00Z',
		description: 'End of the snooze window (ISO8601 UTC)',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['updateProductAvailabilityByPlu', 'markProductsOutOfStockByTag'],
			},
		},
	},
	{
		displayName: 'Tag IDs',
		name: 'tagIds',
		type: 'json',
		default: `[1]`,
		description: 'Array of numeric tag identifiers',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['markProductsOutOfStockByTag'],
			},
		},
	},
	{
		displayName: 'Is Active',
		name: 'isActive',
		type: 'boolean',
		default: true,
		description: 'Whether to keep the store active (online) for the selected scope',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['setStoreStatus', 'updateStoreStatusPrepTime'],
			},
		},
	},
	{
		displayName: 'Disable At',
		name: 'disableAt',
		type: 'string',
		default: '',
		placeholder: '2025-11-22T12:00:00Z',
		description: 'Optional timestamp to automatically revert the busy mode',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['setStoreStatus', 'updateStoreStatusPrepTime'],
			},
		},
	},
	{
		displayName: 'Preparation Time (Minutes)',
		name: 'prepTime',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		default: 0,
		description: 'New preparation time in minutes for the location',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['updateStoreStatusPrepTime'],
			},
		},
	},
	{
		displayName: 'Channel Links',
		name: 'channelLinks',
		type: 'json',
		default: `[]`,
		description: 'Optional array of channelLink IDs to scope the status/prep change',
		displayOptions: {
			show: {
				resource: ['storeAPI'],
				operation: ['updateStoreStatusPrepTime'],
			},
		},
	},
	{
		displayName: 'Holidays',
		name: 'holidays',
		type: 'json',
		default: `{"locations": [{"id": "65***********aa56be7b63", "holidays": []}]}`,
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
		default: `{"locations": [{"id": "", "openingHours": []}]}`,
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
	fields: [accountField, locationField, ...storeSpecificFields],
};

