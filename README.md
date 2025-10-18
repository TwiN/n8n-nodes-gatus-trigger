# n8n-nodes-gatus-trigger
[![npm package version](https://img.shields.io/npm/v/n8n-nodes-gatus-trigger)](https://www.npmjs.com/package/n8n-nodes-gatus-trigger)

This is a n8n community node that lets you receive webhook alerts from [Gatus](https://github.com/TwiN/gatus), a developer-oriented health monitoring and status page system.


## Installation
Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install n8n-nodes-gatus-trigger
```

### n8n Cloud
For n8n cloud users, follow the [n8n Cloud installation guide](https://docs.n8n.io/integrations/community-nodes/installation/gui-install/).

## Operations
This node provides a single trigger operation:

- **Webhook Trigger**: Receives HTTP POST webhooks from Gatus when alerts are triggered or resolved

## Configuring Gatus
To send alerts to this n8n trigger node, configure Gatus to use the n8n alerting provider:

### 1. Get Your Webhook URL
After adding the Gatus Trigger node to your n8n workflow:
1. Click "Listen for Test Event" to get the test webhook URL
2. Once your workflow is activated, use the Production webhook URL

### 2. Configure Gatus
Add the following to your Gatus configuration file (`config.yaml`):

```yaml
alerting:
  n8n:
    webhook-url: "https://your-n8n-instance.com/webhook/your-webhook-path"
  default-alert:
    send-on-resolved: true 

endpoints:
  - name: example-api
    url: "https://api.example.com/health"
    interval: 1m
    conditions:
      - "[STATUS] == 200"
    alerts:
      - type: n8n
        description: "API health check failed"
```

### Gatus Webhook Payload Structure
Gatus automatically sends webhooks with the following JSON structure (based on the [official n8n provider implementation](https://github.com/TwiN/gatus/blob/master/alerting/provider/n8n/n8n.go)):

- `title`: Title of the alert (configurable in Gatus, defaults to "Gatus")
- `endpoint_name`: Name of the monitored endpoint
- `endpoint_group`: Group the endpoint belongs to (optional)
- `endpoint_url`: URL being monitored
- `alert_description`: Description from your alert configuration (optional)
- `resolved`: Boolean - `true` if alert is resolved, `false` if triggered
- `message`: Auto-generated message describing the alert
- `condition_results`: Array of condition check results (optional)

**Note:** You typically don't need to customize the payload - Gatus sends the correct structure automatically. However, if you need to customize the title, you can configure it in your Gatus config:

```yaml
alerting:
  n8n:
    webhook-url: "https://your-n8n-instance.com/webhook/your-webhook-path"
    title: "Production Monitoring"  # Optional: customize the title
```

## Node Parameters

### Path
- **Optional**: Custom webhook path
- **Default**: Auto-generated
- Leave empty to use an automatically generated webhook path, or specify a custom path for easier management

### Options

#### Alert Type Filter
- **All**: Receive both triggered and resolved alerts (default)
- **Triggered Only**: Only receive alerts when endpoints fail
- **Resolved Only**: Only receive alerts when endpoints recover

#### Endpoint Group Filter
- Filter alerts by endpoint group
- Leave empty to receive alerts from all groups
- Example: Set to "production" to only receive alerts for production endpoints

#### Endpoint Name Filter
- Filter alerts by endpoint name
- Leave empty to receive alerts from all endpoints
- Example: Set to "api-server" to only receive alerts for that specific endpoint

## Example Workflows

### Basic Alert Notification

```
Gatus Trigger → Send Email
```

Send an email whenever a Gatus alert is triggered.

### Conditional Response Based on Alert Type

```
Gatus Trigger → IF Node → Send Slack Message / Log to Database
```

Send Slack notifications for triggered alerts and log resolved alerts to a database.

### Alert Management

```
Gatus Trigger → Set Variables → HTTP Request → Update Dashboard
```

Process the alert data and update an external monitoring dashboard.

## Output Data

The trigger node outputs the following data structure:

```json
{
  "title": "Gatus",
  "endpoint_name": "api-server",
  "endpoint_group": "production",
  "endpoint_url": "https://api.example.com/health",
  "alert_description": "API health check failed",
  "resolved": false,
  "message": "An alert for api-server has been triggered due to having failed 3 time(s) in a row",
  "condition_results": [
    {
      "condition": "[STATUS] == 200",
      "success": false
    },
    {
      "condition": "[RESPONSE_TIME] < 500",
      "success": true
    }
  ]
}
```

### Field Descriptions

- **title**: The configured title from Gatus (defaults to "Gatus")
- **endpoint_name**: Name of the endpoint that triggered the alert
- **endpoint_group**: Optional group classification
- **endpoint_url**: The URL being monitored
- **alert_description**: Custom description from your Gatus alert configuration
- **resolved**: `true` when an alert is resolved, `false` when triggered
- **message**: Human-readable message generated by Gatus
- **condition_results**: Array of all condition checks with their results

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Link for local development
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-gatus-trigger
```

### Testing

To test the node locally:

1. Start n8n with `n8n start`
2. Add the Gatus Trigger node to a workflow
3. Click "Listen for Test Event"
4. Send a test webhook using curl:

```bash
curl -X POST https://your-n8n-instance.com/webhook/your-webhook-path \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gatus",
    "endpoint_name": "test-api",
    "endpoint_group": "test",
    "endpoint_url": "https://test.example.com",
    "alert_description": "Test alert",
    "resolved": false,
    "message": "An alert for test-api has been triggered due to having failed 3 time(s) in a row",
    "condition_results": [
      {
        "condition": "[STATUS] == 200",
        "success": false
      }
    ]
  }'
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Gatus documentation](https://gatus.io/docs/)
- [Gatus GitHub repository](https://github.com/TwiN/gatus)
- [Gatus alerting configuration](https://gatus.io/docs/alerting-getting-started)
