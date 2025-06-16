#!/bin/bash

read -p "Enter the port number to test (default: 8080): " port

PORT=${port:-8080}

echo "--- Starting test on http://localhost:${PORT}/temperature ---"


start_time=$(date +%s%N)

results=$(for i in $(seq 1 200); do
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:${PORT}/temperature" &
done)

wait

end_time=$(date +%s%N)

duration=$(( (end_time - start_time) / 1000000 ))

echo "----------------------------------------"
echo "Test Complete"
echo "Total time taken: ${duration}ms"
echo "----------------------------------------"

echo "Successful Requests (200):"
echo "$results" | grep -c "200"

echo "Rate Limited Requests (429):"
echo "$results" | grep -c "429"