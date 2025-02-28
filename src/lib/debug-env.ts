// Debug utility to check environment variables
export function checkEnvironmentVariables() {
  const variables = {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NODE_ENV: process.env.NODE_ENV
  };

  console.log("Environment variables check:");

  Object.entries(variables).forEach(([key, value]) => {
    console.log(`- ${key}: ${value ? "✓ Set" : "✗ NOT SET"}`);
  });

  return variables;
}
