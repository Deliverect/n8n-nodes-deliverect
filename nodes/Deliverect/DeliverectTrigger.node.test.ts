import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { DeliverectTrigger } from './DeliverectTrigger.node';
import type { IWebhookFunctions, IDataObject } from 'n8n-workflow';

/**
 * Creates a mock IWebhookFunctions context for testing the DeliverectTrigger webhook handler.
 */
function createMockWebhookFunctions(options: {
	body: IDataObject;
	headers?: Record<string, string>;
	rawBody?: string | Buffer;
	verifySignature?: boolean | string;
	webhookSecret?: string;
}): IWebhookFunctions {
	const {
		body,
		headers = {},
		rawBody,
		verifySignature = false,
		webhookSecret = '',
	} = options;

	const reqObject: IDataObject & { rawBody?: string | Buffer } = {
		body,
		headers,
	};
	if (rawBody !== undefined) {
		reqObject.rawBody = rawBody;
	}

	return {
		getRequestObject: vi.fn().mockReturnValue(reqObject),
		getNodeParameter: vi.fn().mockImplementation((name: string) => {
			if (name === 'verifySignature') return verifySignature;
			if (name === 'path') return 'deliverect-order';
			if (name === 'responseMode') return 'responseNode';
			return undefined;
		}),
		getCredentials: vi.fn().mockResolvedValue({ webhookSecret }),
		getNode: vi.fn().mockReturnValue({ name: 'DeliverectTrigger' }),
	} as unknown as IWebhookFunctions;
}

/**
 * Generates a valid HMAC signature for a given payload and secret.
 */
function generateHmacSignature(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('DeliverectTrigger', () => {
	let trigger: DeliverectTrigger;

	beforeEach(() => {
		trigger = new DeliverectTrigger();
	});

	describe('webhook handler', () => {
		describe('event type detection', () => {
			it('should detect newOrder event when payload has _id and items', async () => {
				const orderPayload = {
					_id: 'order123',
					items: [{ name: 'Pizza', quantity: 1 }],
					customer: { name: 'John Doe' },
				};

				const mockFunctions = createMockWebhookFunctions({
					body: orderPayload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
				expect(result.workflowData![0][0].json._eventType).toBe('newOrder');
				expect(result.workflowData![0][0].json._id).toBe('order123');
				expect(result.workflowData![0][0].json._receivedAt).toBeDefined();
			});

			it('should detect statusUpdate event when payload has orderId, status, and timeStamp', async () => {
				const statusPayload = {
					orderId: 'order123',
					status: 'accepted',
					timeStamp: '2025-11-28T12:00:00Z',
				};

				const mockFunctions = createMockWebhookFunctions({
					body: statusPayload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData![0][0].json._eventType).toBe('statusUpdate');
				expect(result.workflowData![0][0].json.orderId).toBe('order123');
				expect(result.workflowData![0][0].json.status).toBe('accepted');
			});

			it('should detect courierUpdate event when payload has orderId and courier', async () => {
				const courierPayload = {
					orderId: 'order123',
					courier: {
						name: 'Jane Driver',
						phone: '+1234567890',
						location: { lat: 51.5074, lng: -0.1278 },
					},
				};

				const mockFunctions = createMockWebhookFunctions({
					body: courierPayload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData![0][0].json._eventType).toBe('courierUpdate');
				expect(result.workflowData![0][0].json.courier).toEqual(courierPayload.courier);
			});

			it('should return unknown event type for unrecognized payload structure', async () => {
				const unknownPayload = {
					someField: 'someValue',
					anotherField: 123,
				};

				const mockFunctions = createMockWebhookFunctions({
					body: unknownPayload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData![0][0].json._eventType).toBe('unknown');
			});
		});

		describe('HMAC signature verification', () => {
			const webhookSecret = 'test-secret-key';

			it('should accept valid HMAC signature', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);
				const signature = generateHmacSignature(rawBody, webhookSecret);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': signature },
					rawBody,
					verifySignature: true,
					webhookSecret,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
				expect(result.workflowData![0][0].json._id).toBe('order123');
			});

			it('should accept signature from X-Deliverect-Signature header (case variation)', async () => {
				const payload = { _id: 'order456', items: [] };
				const rawBody = JSON.stringify(payload);
				const signature = generateHmacSignature(rawBody, webhookSecret);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'X-Deliverect-Signature': signature },
					rawBody,
					verifySignature: true,
					webhookSecret,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData![0][0].json._id).toBe('order456');
			});

			it('should reject invalid HMAC signature', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);
				const invalidSignature = generateHmacSignature(rawBody, 'wrong-secret');

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': invalidSignature },
					rawBody,
					verifySignature: true,
					webhookSecret,
				});

				await expect(trigger.webhook.call(mockFunctions)).rejects.toThrow(
					'Invalid HMAC signature'
				);
			});

			it('should reject when signature header is missing', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: {},
					rawBody,
					verifySignature: true,
					webhookSecret,
				});

				await expect(trigger.webhook.call(mockFunctions)).rejects.toThrow(
					'Missing HMAC signature'
				);
			});

			it('should reject when rawBody is not available', async () => {
				const payload = { _id: 'order123', items: [] };

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': 'somesignature' },
					// rawBody intentionally omitted
					verifySignature: true,
					webhookSecret,
				});

				await expect(trigger.webhook.call(mockFunctions)).rejects.toThrow(
					'Raw request body not available'
				);
			});

			it('should reject when webhook secret is not configured', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': 'somesignature' },
					rawBody,
					verifySignature: true,
					webhookSecret: '', // Empty secret
				});

				await expect(trigger.webhook.call(mockFunctions)).rejects.toThrow(
					'Webhook secret is required'
				);
			});

			it('should handle rawBody as Buffer', async () => {
				const payload = { _id: 'order789', items: [] };
				const rawBodyString = JSON.stringify(payload);
				const rawBodyBuffer = Buffer.from(rawBodyString, 'utf8');
				const signature = generateHmacSignature(rawBodyString, webhookSecret);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': signature },
					rawBody: rawBodyBuffer,
					verifySignature: true,
					webhookSecret,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData![0][0].json._id).toBe('order789');
			});
		});

		describe('verifySignature parameter handling', () => {
			it('should skip verification when verifySignature is false', async () => {
				const payload = { _id: 'order123', items: [] };

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					verifySignature: false,
					// No signature header, no rawBody - should still work
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
			});

			it('should handle verifySignature as string "true"', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);
				const webhookSecret = 'test-secret';
				const signature = generateHmacSignature(rawBody, webhookSecret);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': signature },
					rawBody,
					verifySignature: 'true', // String instead of boolean
					webhookSecret,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
			});

			it('should handle verifySignature as string "false"', async () => {
				const payload = { _id: 'order123', items: [] };

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					verifySignature: 'false', // String instead of boolean
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
			});

			it('should handle verifySignature as string "1"', async () => {
				const payload = { _id: 'order123', items: [] };
				const rawBody = JSON.stringify(payload);
				const webhookSecret = 'test-secret';
				const signature = generateHmacSignature(rawBody, webhookSecret);

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					headers: { 'x-deliverect-signature': signature },
					rawBody,
					verifySignature: '1',
					webhookSecret,
				});

				const result = await trigger.webhook.call(mockFunctions);

				expect(result.workflowData).toBeDefined();
			});
		});

		describe('error handling', () => {
			it('should throw error when body is empty/null', async () => {
				const mockFunctions = createMockWebhookFunctions({
					body: null as unknown as IDataObject,
					verifySignature: false,
				});

				await expect(trigger.webhook.call(mockFunctions)).rejects.toThrow(
					'No data received'
				);
			});
		});

		describe('response structure', () => {
			it('should include _receivedAt timestamp in ISO format', async () => {
				const payload = { _id: 'order123', items: [] };

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);

				const receivedAt = result.workflowData![0][0].json._receivedAt as string;
				expect(receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
			});

			it('should preserve all original payload fields', async () => {
				const payload = {
					_id: 'order123',
					items: [{ name: 'Burger' }],
					customer: { name: 'Alice', email: 'alice@example.com' },
					total: 25.99,
					notes: 'No onions',
				};

				const mockFunctions = createMockWebhookFunctions({
					body: payload,
					verifySignature: false,
				});

				const result = await trigger.webhook.call(mockFunctions);
				const json = result.workflowData![0][0].json;

				expect(json._id).toBe('order123');
				expect(json.items).toEqual([{ name: 'Burger' }]);
				expect(json.customer).toEqual({ name: 'Alice', email: 'alice@example.com' });
				expect(json.total).toBe(25.99);
				expect(json.notes).toBe('No onions');
			});
		});
	});
});

