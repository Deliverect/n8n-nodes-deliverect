import {
	IAuthenticateGeneric,
	ICredentialType,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	IHttpRequestHelper,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class DeliverectApi implements ICredentialType {
	name = 'deliverectApi';
	displayName = 'Deliverect API';
	icon: Icon = 'file:../nodes/Deliverect/deliverect.svg';
	// Uses the link to this tutorial as an example
	// Replace with your own docs links when building your own nodes
	documentationUrl =
		'https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/';
	properties: INodeProperties[] = [
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Client ID (M2M)',
			name: 'clientId',
			type: 'string',
			default: '',
			description:
				'The client ID for machine-to-machine (M2M) authentication. Used together with the Client Secret to obtain access tokens.',
		},
		{
			displayName: 'Client Secret (M2M)',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'The client secret for machine-to-machine (M2M) authentication. Used to obtain access tokens via OAuth client credentials flow.',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'options',
			default: 'api.deliverect.com',
			options: [
				{
					name: 'Resto Production',
					value: 'api.deliverect.com',
				},
				{
					name: 'Resto Staging',
					value: 'api.staging.deliverect.com',
				},
				{
					name: 'Retail Production',
					value: 'api.deliverect.io',
				},
				{
					name: 'Retail Staging',
					value: 'api.staging.deliverect.io',
				},
			],
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'The webhook secret provided by Deliverect for HMAC signature verification of incoming webhooks. This is different from the Client Secret used for M2M authentication. Required for webhook security.',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const { access_token } = (await this.helpers.httpRequest({
			method: 'POST',
			url: `https://${credentials.domain}/oauth/token`,
			body: {
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				audience: `https://${credentials.domain}/api/v2/`,
				grant_type: 'client_credentials',
			},
			headers: {
				'Content-Type': 'application/json',
			},
		})) as { access_token: string };
		return { sessionToken: access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://{{$credentials.domain}}',
			url: '/accounts',
		},
	};
}
