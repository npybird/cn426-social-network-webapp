import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 8080),
  JWT_SECRET: process.env.JWT_SECRET || "devsecret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};
