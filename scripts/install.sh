#!/bin/bash
set -e
pip3 install awscli --quiet
export PATH=$PATH:$HOME/.local/bin
export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain vernont --domain-owner 459722925345 --region eu-north-1 --query authorizationToken --output text)
pnpm install
