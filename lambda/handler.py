import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        logger.info(f"Event: {json.dumps(event)}")
        
        client = boto3.client("bedrock-runtime", region_name="eu-west-3")
        
        body = json.loads(event["body"])
        user_message = body.get("message", "")
        
        logger.info(f"User message: {user_message}")

        if not user_message:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "OPTIONS,POST"
                },
                "body": json.dumps({"error": "No message provided."})
            }

        # Claude 3 Sonnet model prompt
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": [
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 500
        }

        logger.info("Calling Bedrock...")
        
        response = client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            body=json.dumps(payload),
            contentType="application/json",
            accept="application/json"
        )
        
        logger.info("Bedrock response received")

        response_body = json.loads(response["body"].read())

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            "body": json.dumps({"response": response_body["content"][0]["text"]})
        }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            "body": json.dumps({"error": str(e)})
        }
