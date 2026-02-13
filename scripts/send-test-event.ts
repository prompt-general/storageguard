import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const client = new SQSClient({ region: 'us-east-1', endpoint: 'http://localhost:4566' });

const event = {
    version: '0',
    id: 'test-event-id',
    'detail-type': 'AWS API Call via CloudTrail',
    source: 'aws.s3',
    account: '123456789012',
    time: new Date().toISOString(),
    region: 'us-east-1',
    resources: [{ ARN: 'arn:aws:s3:::test-bucket', accountId: '123456789012', type: 'AWS::S3::Bucket' }],
    detail: {
        eventSource: 's3.amazonaws.com',
        eventName: 'PutBucketPublicAccessBlock',
        awsRegion: 'us-east-1',
        requestParameters: {
            bucketName: 'test-bucket',
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
    },
};

async function send() {
    const command = new SendMessageCommand({
        QueueUrl: 'http://localhost:4566/000000000000/storageguard-events',
        MessageBody: JSON.stringify(event),
    });
    try {
        await client.send(command);
        console.log('Test event sent');
    } catch (error) {
        console.error('Error sending test event:', error);
    }
}

send();
