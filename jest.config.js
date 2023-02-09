const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, './.env.development') });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
}
