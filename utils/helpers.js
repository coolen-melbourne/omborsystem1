const hbs = require("hbs");

// Mavjud helperlar
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
hbs.registerHelper("multiply", function (a, b) {
  return a * b;
});
hbs.registerHelper("formatDate", function (date) {
  return new Date(date).toLocaleString("uz-UZ");
});
hbs.registerHelper("inc", function (index) {
  return index + 1;
});
hbs.registerHelper("json", function (context) {
  return JSON.stringify(context);
});

// Math helper
hbs.registerHelper("math", function (lvalue, operator, rvalue) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);
  switch (operator) {
    case "+":
      return lvalue + rvalue;
    case "-":
      return lvalue - rvalue;
    case "*":
      return lvalue * rvalue;
    case "/":
      return lvalue / rvalue;
    default:
      return NaN;
  }
});

// Pagination helperlar
hbs.registerHelper("gt", function (a, b) {
  return a > b;
});
hbs.registerHelper("subtract", function (a, b) {
  return a - b;
});
hbs.registerHelper("add", function (a, b) {
  return a + b;
});
hbs.registerHelper("range", function (start, end) {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
});
