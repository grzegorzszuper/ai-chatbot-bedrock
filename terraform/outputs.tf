output "api_url" {
  description = "API Gateway endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.chatbot_api.id}.execute-api.eu-west-3.amazonaws.com/${aws_api_gateway_stage.chatbot_stage.stage_name}/chat"
}