provider "aws" {
  region = "eu-west-3"
}

resource "aws_iam_role" "lambda_bedrock_role" {
  name = "lambda-bedrock-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "bedrock_invoke_policy" {
  name = "bedrock-invoke-policy"
  role = aws_iam_role.lambda_bedrock_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "bedrock:InvokeModel"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "chatbot_lambda" {
  function_name = "ai-chatbot-lambda"
  role          = aws_iam_role.lambda_bedrock_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  filename      = "lambda.zip"
  timeout       = 10
  source_code_hash = filebase64sha256("lambda.zip")
}
