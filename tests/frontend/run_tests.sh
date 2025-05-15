#!/bin/bash

# Shell script to run frontend tests

# Default values
APP_URL=${APP_URL:-http://localhost}
TEST_TYPE=${TEST_TYPE:-"components"} # 'components' or 'e2e' or 'all'

# Display settings
echo "Running frontend tests with settings:"
echo "  - APP_URL: $APP_URL"
echo "  - TEST_TYPE: $TEST_TYPE"
echo "--------------------------------------------"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing test dependencies..."
    npm install
fi

# Set environment variable for test
export APP_URL

# Run tests based on type
if [ "$TEST_TYPE" = "components" ] || [ "$TEST_TYPE" = "all" ]; then
    echo "Running component tests..."
    npm run test:components
    COMPONENT_EXIT_CODE=$?
fi

if [ "$TEST_TYPE" = "e2e" ] || [ "$TEST_TYPE" = "all" ]; then
    echo "Running end-to-end tests..."
    npm run test:e2e
    E2E_EXIT_CODE=$?
fi

# Determine exit code
if [ "$TEST_TYPE" = "all" ]; then
    # If running all tests, exit with error if either test type failed
    if [ $COMPONENT_EXIT_CODE -ne 0 ] || [ $E2E_EXIT_CODE -ne 0 ]; then
        echo "--------------------------------------------"
        echo "Some frontend tests failed!"
        exit 1
    fi
elif [ "$TEST_TYPE" = "components" ]; then
    # If running only component tests, use component exit code
    if [ $COMPONENT_EXIT_CODE -ne 0 ]; then
        echo "--------------------------------------------"
        echo "Component tests failed!"
        exit 1
    fi
elif [ "$TEST_TYPE" = "e2e" ]; then
    # If running only e2e tests, use e2e exit code
    if [ $E2E_EXIT_CODE -ne 0 ]; then
        echo "--------------------------------------------"
        echo "End-to-end tests failed!"
        exit 1
    fi
fi

echo "--------------------------------------------"
echo "All frontend tests passed successfully!"
exit 0 