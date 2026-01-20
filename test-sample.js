// Test file with intentional errors for CLI testing

function calculateTotal(items) {
  let total = 0;
  
  // Error: undefined variable
  for (let i = 0; i < count; i++) {
    total += items[i].price;
  }
  
  return total;
}

// Error: unused variable
const unusedVar = 42;

// Error: potential null reference
function getUserName(user) {
  return user.name.toUpperCase();
}

// Error: missing return statement
function addNumbers(a, b) {
  const sum = a + b;
  // Missing return
}

console.log(calculateTotal([{ price: 10 }, { price: 20 }]));
