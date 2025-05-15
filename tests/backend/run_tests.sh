#!/bin/bash

# Shell script to run backend API tests

# Set environment variables
export API_BASE_URL=${API_BASE_URL:-http://localhost/api}

echo "Running backend API tests against $API_BASE_URL"
echo "--------------------------------------------"

# Install test dependencies if not already installed
if ! pip3 list | grep -q requests; then
    echo "Installing test dependencies..."
    pip3 install requests
fi

# Run the tests
python3 test_api.py

# Check the exit code
if [ $? -eq 0 ]; then
    echo "--------------------------------------------"
    echo "All backend API tests passed successfully!"
    exit 0
else
    echo "--------------------------------------------"
    echo "Some backend API tests failed!"
    exit 1
fi 