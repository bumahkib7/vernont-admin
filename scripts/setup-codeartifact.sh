#!/bin/bash
set -e

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
    rm -rf awscliv2.zip aws
fi

# Get CodeArtifact auth token
echo "Getting CodeArtifact auth token..."
export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token \
    --domain vernont \
    --domain-owner 459722925345 \
    --region eu-north-1 \
    --query authorizationToken \
    --output text)

echo "CODEARTIFACT_AUTH_TOKEN=$CODEARTIFACT_AUTH_TOKEN" >> $GITHUB_ENV 2>/dev/null || true

# Run pnpm install
echo "Running pnpm install..."
pnpm install
