import { LANGS } from '@/constants';
import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongoUrl: string,
  jwtSecret: string,
  jwtExpiresIn: string,
  hashSecret: string,
  languages: string[],
  mailUser: string,
  mailPass: string,
  superAdmin: string
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'examplePhoneticsSecretPhrases',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  hashSecret: process.env.HASH_SECRET || 'default_secret_key_for_phonetics', languages: LANGS,
  mailUser: process.env.MAIL_USER || '',
  mailPass: process.env.MAIL_PASSWORD || '',
  superAdmin: process.env.MAIL_SUPER_ADMIN || ''
};

export default config;