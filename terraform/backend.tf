terraform {
  backend "remote" {
    organization = "Terraform-nauka"

    workspaces {
      name = "ai-chatbot-bedrock"
    }
  }
}
