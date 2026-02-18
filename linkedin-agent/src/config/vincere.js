import dotenv from 'dotenv';
dotenv.config();

export const vincereConfig = {
  domain: process.env.VINCERE_DOMAIN || 'mvpeople',
  apiKey: process.env.VINCERE_API_KEY,
  clientId: process.env.VINCERE_CLIENT_ID,
  idServer: process.env.VINCERE_ID_SERVER || 'https://id.vincere.io',
  redirectUri: process.env.VINCERE_REDIRECT_URI || 'http://localhost:3002/auth/vincere/callback',
  get baseUrl() {
    return `https://${this.domain}.vincere.io/api/v2`;
  }
};

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
};
