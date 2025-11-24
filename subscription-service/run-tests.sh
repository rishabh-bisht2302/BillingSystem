#!/bin/bash

# Subscription Service Test Runner Script

echo "╔════════════════════════════════════════════════════╗"
echo "║     Subscription Service E2E Test Runner          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

DB_PORT="${SUBSCRIPTION_DB_PORT:-${DATABASE_PORT:-5432}}"
REDIS_PORT="${SUBSCRIPTION_REDIS_PORT:-${REDIS_PORT:-6379}}"

# Check if services are running
check_services() {
    echo "🔍 Checking if required services are running..."

    # Check PostgreSQL
    if ! nc -z localhost "${DB_PORT}" 2>/dev/null; then
        echo "⚠️  PostgreSQL is not running on port ${DB_PORT}"
        echo "   Start it with: docker-compose up subscription-db -d"
        return 1
    else
        echo "✅ PostgreSQL is running"
    fi

    # Check Redis
    if ! nc -z localhost "${REDIS_PORT}" 2>/dev/null; then
        echo "⚠️  Redis is not running on port ${REDIS_PORT}"
        echo "   Start it with: docker-compose up redis -d"
        return 1
    else
        echo "✅ Redis is running"
    fi

    echo ""
    return 0
}

run_with_pattern() {
    local pattern="$1"
    if check_services; then
        npm run test:e2e -- --testNamePattern="${pattern}"
    else
        exit 1
    fi
}

# Run tests based on argument
case "${1}" in
    "health")
        echo "🧪 Running Health endpoint tests only..."
        run_with_pattern "Health Endpoint"
        ;;
    "login")
        echo "🧪 Running Login endpoint tests only..."
        run_with_pattern "Login Endpoint"
        ;;
    "plans")
        echo "🧪 Running Plan management tests only..."
        run_with_pattern "Plan"
        ;;
    "users")
        echo "🧪 Running User profile tests only..."
        run_with_pattern "User"
        ;;
    "payment")
        echo "🧪 Running Payment flow tests only..."
        run_with_pattern "Payment Flow"
        ;;
    "help"|"--help"|"-h")
        echo "Usage: ./run-tests.sh [option]"
        echo ""
        echo "Options:"
        echo "  health       Run health endpoint tests only"
        echo "  login        Run login endpoint tests only"
        echo "  plans        Run plan management tests only"
        echo "  users        Run user profile tests only"
        echo "  payment      Run payment flow tests only"
        echo "  help         Show this help message"
        echo ""
        echo "No option: Run all E2E tests"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh              # Run all tests"
        echo "  ./run-tests.sh subscription      # Run subscription flow tests only"
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


