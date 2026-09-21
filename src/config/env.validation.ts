import * as Joi from 'joi';

const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().min(1).default(10),
}).unknown(true);

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Invalid environment variables:\n${error.message}`);
  }

  return value as Record<string, unknown>;
}
