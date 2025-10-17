import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

// Gatus webhook payload structure based on official implementation
// https://github.com/TwiN/gatus/blob/master/alerting/provider/n8n/n8n.go
interface GatusWebhookPayload {
	title: string;
	endpoint_name: string;
	endpoint_group?: string;
	endpoint_url: string;
	alert_description?: string;
	resolved: boolean;
	message: string;
	condition_results?: ConditionResult[];
}

interface ConditionResult {
	condition: string;
	success: boolean;
}

export class GatusTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gatus Trigger',
		name: 'gatusTrigger',
		icon: 'file:gatus.png',
		group: ['trigger'],
		version: 1,
		description: 'Receives webhook alerts from Gatus monitoring system',
		defaults: {
			name: 'Gatus Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '={{$parameter["path"]}}',
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				placeholder: 'webhook',
				description: 'The path for the webhook URL. Leave empty to use an auto-generated path.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Alert Type Filter',
						name: 'alertTypeFilter',
						type: 'options',
						options: [
							{
								name: 'All',
								value: 'all',
							},
							{
								name: 'Triggered Only',
								value: 'triggered',
							},
							{
								name: 'Resolved Only',
								value: 'resolved',
							},
						],
						default: 'all',
						description: 'Filter alerts by their trigger status',
					},
					{
						displayName: 'Endpoint Group Filter',
						name: 'endpointGroupFilter',
						type: 'string',
						default: '',
						placeholder: 'production',
						description: 'Only trigger for endpoints in this group (leave empty for all groups)',
					},
					{
						displayName: 'Endpoint Name Filter',
						name: 'endpointNameFilter',
						type: 'string',
						default: '',
						placeholder: 'api-server',
						description: 'Only trigger for endpoints matching this name (leave empty for all endpoints)',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const options = this.getNodeParameter('options', {}) as IDataObject;
		const bodyData = this.getBodyData() as unknown as GatusWebhookPayload;
		// Validate webhook payload
		if (!bodyData || typeof bodyData !== 'object') {
			throw new Error('Invalid webhook payload: Expected JSON object');
		}
		// Validate Gatus-specific structure
		if (!('resolved' in bodyData) || typeof bodyData.resolved !== 'boolean') {
			throw new Error('Invalid Gatus webhook: Missing or invalid "resolved" field');
		}
		// Apply alert type filter
		if (options.alertTypeFilter && options.alertTypeFilter !== 'all') {
			const filter = options.alertTypeFilter as string;
			// Gatus sends "resolved: true" for resolved alerts, "resolved: false" for triggered
			if (filter === 'triggered' && bodyData.resolved) {
				// Don't trigger workflow for resolved alerts
				return {
					noWebhookResponse: true,
				};
			}
			if (filter === 'resolved' && !bodyData.resolved) {
				// Don't trigger workflow for triggered alerts
				return {
					noWebhookResponse: true,
				};
			}
		}
		// Apply endpoint group filter
		if (options.endpointGroupFilter) {
			const filter = options.endpointGroupFilter as string;
			if (bodyData.endpoint_group !== filter) {
				// Don't trigger workflow for different endpoint groups
				return {
					noWebhookResponse: true,
				};
			}
		}
		// Apply endpoint name filter
		if (options.endpointNameFilter) {
			const filter = options.endpointNameFilter as string;
			if (bodyData.endpoint_name !== filter) {
				// Don't trigger workflow for different endpoint names
				return {
					noWebhookResponse: true,
				};
			}
		}
		const returnData: IDataObject[] = [];
		returnData.push({
			title: bodyData.title,
			endpoint_name: bodyData.endpoint_name,
			endpoint_group: bodyData.endpoint_group ?? '',
			endpoint_url: bodyData.endpoint_url,
			alert_description: bodyData.alert_description ?? '',
			resolved: bodyData.resolved,
			message: bodyData.message,
			condition_results: bodyData.condition_results ?? [],
		});
		return {
			workflowData: [this.helpers.returnJsonArray(returnData)],
		};
	}
}
