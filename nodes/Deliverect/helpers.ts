import type { IDataObject, INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export type DeliverectResourceName =
	| 'channelAPI'
	| 'commerceAPI'
	| 'kdsAPI'
	| 'posAPI'
	| 'restAPI'
	| 'storeAPI';

export interface DeliverectResourceModule {
	resource: DeliverectResourceName;
	operations?: INodeProperties | null;
	fields?: INodeProperties[];
}

export interface DeliverectOperationOption extends INodePropertyOptions {
	internal?: boolean;
}

export const deliverectRequestDefaults: IDataObject = {
	baseURL: '=https://{{$credentials.domain}}',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
};

const INTERNAL_NAME_SUFFIX = ' (Internal)';
const INTERNAL_DESCRIPTION_NOTE =
	'Intended for Deliverect integrations, not standard automations.';

const ensureInternalSuffix = (label: string): string =>
	label.includes(INTERNAL_NAME_SUFFIX) ? label : `${label}${INTERNAL_NAME_SUFFIX}`;

const normalizeInternalDescription = (description?: string): string =>
	description ? `${description} ${INTERNAL_DESCRIPTION_NOTE}` : INTERNAL_DESCRIPTION_NOTE;

const normalizeOption = (option: DeliverectOperationOption): INodePropertyOptions => {
	if (!option.internal) {
		return option;
	}

	return {
		...option,
		name: ensureInternalSuffix(option.name),
		action: option.action ? ensureInternalSuffix(option.action) : option.action,
		description: normalizeInternalDescription(option.description),
	};
};

export const createOperationsProperty = (
	resource: DeliverectResourceName,
	options: DeliverectOperationOption[],
	defaultValue: string,
): INodeProperties => ({
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: [resource],
		},
	},
	options: options.map(normalizeOption),
	default: defaultValue,
});

export const flattenResourceModules = (modules: DeliverectResourceModule[]): INodeProperties[] =>
	modules.flatMap((module) => {
		const chunks: INodeProperties[] = [];

		if (module.operations) {
			chunks.push(module.operations);
		}

		if (module.fields?.length) {
			chunks.push(...module.fields);
		}

		return chunks;
	});
