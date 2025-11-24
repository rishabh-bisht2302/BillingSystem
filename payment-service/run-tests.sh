#!/bin/bash

# Payment Service Test Runner Script

echo "╔════════════════════════════════════════════════════╗"
echo "║     Payment Service E2E Test Runner               ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if services are running
check_services() {
    echo "🔍 Checking if required services are running..."
    
    # Check PostgreSQL
    if ! nc -z localhost 5433 2>/dev/null; then
        echo "⚠️  PostgreSQL is not running on port 5433"
        echo "   Start it with: docker-compose up payment-db -d"
        return 1
    else
        echo "✅ PostgreSQL is running"
    fi
    
    # Check Redis
    if ! nc -z localhost 6379 2>/dev/null; then
        echo "⚠️  Redis is not running on port 6379"
        echo "   Start it with: docker-compose up redis -d"
        return 1
    else
        echo "✅ Redis is running"
    fi
    
    echo ""
    return 0
}

# Run tests based on argument
case "${1}" in
    "payment")
        echo "🧪 Running Payment tests only..."
        npm run test:e2e -- --testNamePattern="Payment"
        ;;
    "refund")
        echo "🧪 Running Refund tests only..."
        npm run test:e2e -- --testNamePattern="Refund"
        ;;
    "health")
        echo "🧪 Running Health check tests only..."
        npm run test:e2e -- --testNamePattern="Health"
        ;;
    "validation")
        echo "🧪 Running Validation error tests only..."
        npm run test:e2e -- --testNamePattern="Validation"
        ;;
    "coverage")
        echo "🧪 Running all tests with coverage..."
        npm run test:cov
        ;;
    "watch")
        echo "👀 Running tests in watch mode..."
        npm run test:watch
        ;;
    "check")
        check_services
        exit $?
        ;;
    "help"|"--help"|"-h")
        echo "Usage: ./run-tests.sh [option]"
        echo ""
        echo "Options:"
        echo "  payment      Run payment initiation tests only"
        echo "  refund       Run refund initiation tests only"
        echo "  health       Run health check tests only"
        echo "  validation   Run validation error tests only"
        echo "  coverage     Run all tests with coverage report"
        echo "  watch        Run tests in watch mode"
        echo "  check        Check if required services are running"
        echo "  help         Show this help message"
        echo ""
        echo "No option: Run all E2E tests"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh              # Run all tests"
        echo "  ./run-tests.sh payment      # Run payment tests only"
        echo "  ./run-tests.sh coverage     # Run with coverage"
        echo ""
        exit 0
        ;;
    "")
        echo "🧪 Running all E2E tests..."
        echo ""
        if check_services; then
            npm run test:e2e
        else
            echo ""
            echo "❌ Tests cannot run without required services"
            exit 1
        fi
        ;;
    *)
        echo "❌ Unknown option: ${1}"
        echo "Run './run-tests.sh help' for usage information"
        exit 1
        ;;
esac

echo ""
echo "✨ Test run completed!"

