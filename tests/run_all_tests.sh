#!/bin/bash

# Main test script to run all tests

echo "========================================================"
echo "   Text-to-Speech Application - Comprehensive Tests"
echo "========================================================"

# Function to print section headers
section() {
    echo ""
    echo "--------------------------------------------------------"
    echo "  $1"
    echo "--------------------------------------------------------"
}

# Determine if running in CI environment
CI_MODE=${CI_MODE:-false}

# Set environment variables
export TEST_MODE=true

# Set test timeout (in seconds)
TIMEOUT=600

section "Starting test containers"
cd "$(dirname "$0")"
docker-compose -f docker-compose.test.yml down --volumes --remove-orphans
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up -d postgres ray-head ray-worker-1 ray-worker-2 frontend loadbalancer

section "Waiting for services to be ready"
echo "Waiting for loadbalancer to be ready..."
timeout $TIMEOUT bash -c 'until curl -s http://localhost:80 > /dev/null; do sleep 5; echo "Waiting..."; done'
echo "Loadbalancer is ready!"

# Wait for database to be ready
echo "Waiting for database to be ready..."
timeout $TIMEOUT bash -c 'until docker-compose -f docker-compose.test.yml exec postgres pg_isready -U cursor_admin -d cursor_tts_db > /dev/null 2>&1; do sleep 5; echo "Waiting..."; done'
echo "Database is ready!"

# Run backend tests
section "Running Backend API Tests"
docker-compose -f docker-compose.test.yml run --rm api-test
BACKEND_EXIT_CODE=$?

# Run frontend component tests
section "Running Frontend Component Tests"
docker-compose -f docker-compose.test.yml run --rm frontend-component-test
FRONTEND_COMPONENT_EXIT_CODE=$?

# Run frontend e2e tests
section "Running Frontend End-to-End Tests"
docker-compose -f docker-compose.test.yml run --rm e2e-test
FRONTEND_E2E_EXIT_CODE=$?

# Cleanup
section "Cleaning up test containers"
docker-compose -f docker-compose.test.yml down --volumes --remove-orphans

# Report results
section "Test Results"
echo "Backend API Tests: $([ $BACKEND_EXIT_CODE -eq 0 ] && echo 'PASSED' || echo 'FAILED')"
echo "Frontend Component Tests: $([ $FRONTEND_COMPONENT_EXIT_CODE -eq 0 ] && echo 'PASSED' || echo 'FAILED')"
echo "Frontend End-to-End Tests: $([ $FRONTEND_E2E_EXIT_CODE -eq 0 ] && echo 'PASSED' || echo 'FAILED')"

# Check exit codes
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_COMPONENT_EXIT_CODE -eq 0 ] && [ $FRONTEND_E2E_EXIT_CODE -eq 0 ]; then
    section "All tests passed successfully!"
    exit 0
else
    section "Some tests failed!"
    exit 1
fi 