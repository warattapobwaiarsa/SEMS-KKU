// frontend/src/lib/config.ts

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'SEMS-KKU',
};
