import type { INodeProperties } from 'n8n-workflow';
import type { DeliverectOperationOption, DeliverectResourceName } from '../helpers';

type RequirementFlag = 'needsAccount' | 'needsLocation';

const operationsForFlag = (
	options: DeliverectOperationOption[],
	flag: RequirementFlag,
): string[] =>
	options.filter((option) => option[flag]).map((option) => option.value as string);

const createScopedField = (
	label: string,
	name: string,
	resource: DeliverectResourceName,
	options: DeliverectOperationOption[],
	flag: RequirementFlag,
): INodeProperties => ({
	displayName: label,
	name,
	type: 'string',
	required: true,
	default: '',
	displayOptions: {
		show: {
			resource: [resource],
			operation: operationsForFlag(options, flag),
		},
	},
});

export const buildAccountField = (
	resource: DeliverectResourceName,
	options: DeliverectOperationOption[],
): INodeProperties => createScopedField('Account ID', 'account', resource, options, 'needsAccount');

export const buildLocationField = (
	resource: DeliverectResourceName,
	options: DeliverectOperationOption[],
): INodeProperties =>
	createScopedField('Location ID', 'location', resource, options, 'needsLocation');
