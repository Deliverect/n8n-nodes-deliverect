import type { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { deliverectRequestDefaults, flattenResourceModules } from './helpers';
import { accountResource } from './resources/account';
import { channelResource } from './resources/channel';
import { commerceResource } from './resources/commerce';
import { kdsResource } from './resources/kds';
import { posResource } from './resources/pos';
import { restResource } from './resources/rest';
import { storeResource } from './resources/store';
import { userResource } from './resources/user';

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
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'deliverectApi',
				required: true,
			},
		],
		requestDefaults: deliverectRequestDefaults,
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account API',
						value: 'accountAPI',
					},
					{
						name: 'Channel API',
						value: 'channelAPI',
					},
					{
						name: 'Commerce API',
						value: 'commerceAPI',
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
					{
						name: 'User API',
						value: 'userAPI',
					},
				],
				default: 'storeAPI',
			},
			...flattenResourceModules([
				accountResource,
				storeResource,
				channelResource,
				posResource,
				commerceResource,
				restResource,
				kdsResource,
				userResource,
			]),
		],
	};
}
