import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

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

export function buildJsonParsingExpression({
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

export function buildProjectionExpression(fields: Record<string, number | object>) {
	return `={{ $parameter.fetchFullPayload ? undefined : JSON.stringify(${JSON.stringify(fields)}) }}`;
}

export async function deliverectPagination(
	this: IExecutePaginationFunctions,
	requestOptions: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const clonedRequest: DeclarativeRestApiSettings.ResultOptions = {
		...requestOptions,
		options: {
			...requestOptions.options,
			qs: {
				...(requestOptions.options.qs ?? {}),
			},
		},
	};

	const qs = (clonedRequest.options.qs ??= {}) as IDataObject;
	const maxResultsPerPage = 500;
	const aggregatedItems: INodeExecutionData[] = [];

	let cursorParameter: string | undefined = 'new';
	let nextPage = 1;
	let totalAvailable: number | undefined;

	while (true) {
		qs.max_results = maxResultsPerPage;
		qs.cursor = cursorParameter;
		qs.page = nextPage;

		const pageItems = await this.makeRoutingRequest({
			...clonedRequest,
			paginate: false,
		});

		if (!pageItems.length) {
			break;
		}

		const firstEntry = pageItems[0]?.json as IDataObject;
		const meta = firstEntry?._meta as IDataObject | undefined;
		const normalizedItems: IDataObject[] = Array.isArray(firstEntry?._items)
			? (firstEntry?._items as IDataObject[])
			: pageItems.map((entry) => entry.json ?? {});

		aggregatedItems.push(
			...normalizedItems.map((item) => ({
				json: item,
			})),
		);

		const returnedCount = normalizedItems.length;
		const pageSize = typeof meta?.max_results === 'number' ? meta.max_results : maxResultsPerPage;
		const currentPage = typeof meta?.page === 'number' ? meta.page : nextPage;
		const cursorFromMeta =
			typeof meta?.cursor === 'string' && meta.cursor.length ? meta.cursor : undefined;

		if (typeof meta?.total === 'number') {
			totalAvailable = meta.total;
		}

		if (cursorFromMeta) {
			cursorParameter = cursorFromMeta;
		} else if (cursorParameter === 'new') {
			cursorParameter = undefined;
		}

		if (!returnedCount) {
			break;
		}

		if (!cursorParameter) {
			break;
		}

		const fetchedSoFar =
			typeof totalAvailable === 'number' && typeof pageSize === 'number'
				? currentPage * pageSize
				: undefined;

		if (
			(typeof fetchedSoFar === 'number' &&
				typeof totalAvailable === 'number' &&
				fetchedSoFar >= totalAvailable) ||
			(returnedCount < maxResultsPerPage && typeof totalAvailable !== 'number')
		) {
			break;
		}

		nextPage = currentPage + 1;
	}

	return aggregatedItems;
}
