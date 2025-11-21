import type {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { createHmac, timingSafeEqual } from 'crypto';

export class DeliverectTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Deliverect Order Webhook Trigger',
		name: 'deliverectTrigger',
		icon: 'file:deliverect.svg',
		group: ['trigger'],
		version: 1,
		description:
			'Triggers the workflow when order events are received from Deliverect. Handles new orders, order status updates, and courier/delivery updates.',
		defaults: {
			name: 'Deliverect Order Webhook',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'deliverectApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: '={{$parameter["responseMode"]}}',
				path: '={{$parameter["path"]}}',
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: 'deliverect-order',
				placeholder: 'deliverect-order',
				description:
					'The path to listen for incoming order webhooks from Deliverect. This will receive new orders, status updates, and courier updates. Provide the full webhook URL to Deliverect API support team along with your account details.',
				required: true,
			},
			{
				displayName: 'Response Mode',
				name: 'responseMode',
				type: 'options',
				options: [
					{
						name: 'Respond When Last Node Finishes',
						value: 'lastNode',
					},
					{
						name: 'Respond Immediately',
						value: 'responseNode',
					},
				],
				default: 'responseNode',
				description: 'When to respond to the webhook',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = req.body as IDataObject;
		const headers = req.headers;

		// Validate that we received data
		if (!body) {
			throw new Error('No data received in webhook request');
		}

		// Verify HMAC signature (always required for security)
		const credentials = await this.getCredentials('deliverectApi');
		const webhookSecret = credentials.webhookSecret as string;
		if (!webhookSecret) {
			throw new Error('Webhook secret is required for HMAC verification. Please configure it in your Deliverect API credentials.');
		}

		const signature = headers['x-deliverect-signature'] || headers['X-Deliverect-Signature'];
		if (!signature) {
			throw new Error('Missing HMAC signature in webhook request');
		}

		// Calculate HMAC signature from raw request body
		// Use rawBody if available (preserves exact formatting from Deliverect)
		// The raw body is needed because JSON.stringify() may produce different formatting
		// (key ordering, whitespace) than the original payload signed by Deliverect
		// Check multiple possible locations where n8n might store the raw body
		const reqWithRawBody = req as IDataObject & { rawBody?: string | Buffer };
		const rawBody = reqWithRawBody.rawBody;
		
		if (!rawBody) {
			throw new Error(
				'Raw request body not available for HMAC verification. ' +
				'The webhook must preserve the raw request body. ' +
				'In n8n, ensure the webhook node is configured to capture raw body data.'
			);
		}

		// Convert rawBody to string if it's a Buffer
		const rawBodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
		
		const calculatedSignature = createHmac('sha256', webhookSecret)
			.update(rawBodyString)
			.digest('hex');

		// Compare signatures (constant-time comparison to prevent timing attacks)
		// Both signatures are in hex format, so decode the incoming signature as hex
		const signatureBuffer = Buffer.from(signature as string, 'hex');
		const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');
		
		if (signatureBuffer.length !== calculatedBuffer.length) {
			throw new Error('Invalid HMAC signature - webhook may not be from Deliverect');
		}
		
		if (!timingSafeEqual(signatureBuffer, calculatedBuffer)) {
			throw new Error('Invalid HMAC signature - webhook may not be from Deliverect');
		}

		// Determine webhook event type based on payload structure
		// Deliverect sends three types of webhook events:
		// 1. New Order: Full order object with _id and items array
		// 2. Status Update: Order status change with orderId, status, and timeStamp
		// 3. Courier Update: Delivery/courier status change with orderId and courier object
		let eventType = 'unknown';
		if (body._id && body.items) {
			eventType = 'newOrder';
		} else if (body.orderId && body.status !== undefined && body.timeStamp) {
			eventType = 'statusUpdate';
		} else if (body.orderId && body.courier) {
			eventType = 'courierUpdate';
		}

		// Return the order data to be processed by the workflow
		return {
			workflowData: [
				[
					{
						json: {
							...body,
							_eventType: eventType,
							_receivedAt: new Date().toISOString(),
						},
					},
				],
			],
		};
	}
}

