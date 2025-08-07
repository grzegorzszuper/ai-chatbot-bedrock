provider "aws" {
  region = "eu-west-3"
}

#################### IAM Role ####################
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "lambda_bedrock_policy"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = "*"
    }]
  })
}

#################### Lambda ####################
resource "aws_lambda_function" "chatbot_lambda" {
  filename         = "lambda.zip"
  function_name    = "chatbotHandler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = filebase64sha256("lambda.zip")
}

#################### API Gateway ####################
resource "aws_api_gateway_rest_api" "chatbot_api" {
  name = "chatbot-api"
}

resource "aws_api_gateway_resource" "chatbot_resource" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  parent_id   = aws_api_gateway_rest_api.chatbot_api.root_resource_id
  path_part   = "chat"
}

### POST Method
resource "aws_api_gateway_method" "chatbot_post" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  resource_id   = aws_api_gateway_resource.chatbot_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "chatbot_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.chatbot_api.id
  resource_id             = aws_api_gateway_resource.chatbot_resource.id
  http_method             = aws_api_gateway_method.chatbot_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.chatbot_lambda.invoke_arn
}

### OPTIONS Method (CORS Preflight)
resource "aws_api_gateway_method" "chatbot_options" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  resource_id   = aws_api_gateway_resource.chatbot_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "chatbot_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chatbot_resource.id
  http_method = aws_api_gateway_method.chatbot_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "chatbot_options_response" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chatbot_resource.id
  http_method = aws_api_gateway_method.chatbot_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "chatbot_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chatbot_resource.id
  http_method = aws_api_gateway_method.chatbot_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.chatbot_options_response]
}

#################### Lambda Permission ####################
resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chatbot_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.chatbot_api.execution_arn}/*/*"
}

#################### CloudWatch Log Group ####################
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.chatbot_api.id}/prod"
  retention_in_days = 7
}

#################### Deployment & Stage ####################
resource "aws_api_gateway_deployment" "chatbot_deployment" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  
  depends_on = [
    aws_api_gateway_integration.chatbot_post_integration,
    aws_api_gateway_integration_response.chatbot_options_integration_response
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.chatbot_post.id,
      aws_api_gateway_integration.chatbot_post_integration.id,
      aws_api_gateway_method.chatbot_options.id,
      aws_api_gateway_integration.chatbot_options_integration.id,
      aws_api_gateway_method_response.chatbot_options_response.id,
      aws_api_gateway_integration_response.chatbot_options_integration_response.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "chatbot_stage" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  deployment_id = aws_api_gateway_deployment.chatbot_deployment.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
      integrationError = "$context.integration.error"
    })
  }
}

resource "aws_api_gateway_method_settings" "chatbot_settings" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  stage_name  = aws_api_gateway_stage.chatbot_stage.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    data_trace_enabled = true
    metrics_enabled    = true
  }
}

#################### Output ####################
output "api_url" {
  description = "API Gateway endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.chatbot_api.id}.execute-api.eu-west-3.amazonaws.com/${aws_api_gateway_stage.chatbot_stage.stage_name}/chat"
}