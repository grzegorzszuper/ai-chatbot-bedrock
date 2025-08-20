terraform {
  backend "remote" {
    organization = "Terraform-nauka"

    workspaces {
      name = "ai-chatbot-bedrock"
    }
  }
}

provider "aws" {
  region = "eu-west-3"
}