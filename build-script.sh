#!/bin/bash

# Build and deploy script for Hostinger

# Set variables
REPO_URL="https://Mirxa27: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@github.com/Mirxa27/agent-M.git"
PROJECT_DIR="/home/u221943340/domains/bot.mirxa.io/public_html"
SSH_USER="u221943340"
SSH_HOST="82.112.251.126"
SSH_PORT="65002"
SSH_KEY_PATH="~/.ssh/id_rsa"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in git npm ssh; do
  if ! command_exists "$cmd"; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

# SSH into Hostinger server
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" <<EOF
  # Navigate to project directory
  cd "$PROJECT_DIR" || exit

  # Check if project directory is a git repository
  if [ ! -d ".git" ]; then
    echo "Error: Project directory is not a git repository."
    exit 1
  fi

  # Pull latest changes from repository
  git pull "$REPO_URL"

  # Install dependencies
  npm install

  # Build the project
  npm run build

  # Check for .env file
  if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please run the installer wizard."
    exit 1
  fi

  # Start the application
  npm start

  # Verify deployment
  if curl -s --head --request GET https://bot.mirxa.io | grep "200 OK" > /dev/null; then
    echo "Deployment successful!"
  else
    echo "Deployment failed. Please check the server logs."
    exit 1
  fi
EOF
