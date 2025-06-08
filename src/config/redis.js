import Redis from 'ioredis';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

/**
 * Redis service class
 * Using ioredis package for Redis operations
 */
class RedisService {
  static #instance;

  /**
   * Get the singleton instance of RedisService
   * @param {Object} options - Redis connection options
   * @returns {RedisService} - The singleton instance
   */
  static getInstance(options = {}) {
    if (!RedisService.#instance) {
      RedisService.#instance = new RedisService(options);
    }
    return RedisService.#instance;
  }

  /**
   * Create a new RedisService instance (private constructor)
   * @param {Object} options - Redis connection options
   */
  constructor(options = {}) {
    // Prevent multiple instances
    if (RedisService.#instance) {
      return RedisService.#instance;
    }

    this.options = {
      host: options.host || config.redis?.host || '127.0.0.1',
      port: options.port || config.redis?.port || 6379,
      username: options.username || config.redis?.username || '',
      password: options.password || config.redis?.password || '',
      db: options.db || config.redis?.db || 0,
      onConnect: options.onConnect || (() => {}),
      onError:
        options.onError ||
        ((err) => logger.error(`Redis client error: ${err.message}`)),
    };

    this.client = null;
    RedisService.#instance = this;
  }

  /**
   * Initialize Redis client if not already initialized
   * @returns {Promise<boolean>} - True if successfully connected or already connected
   */
  async connect() {
    if (this.client && this.isConnected()) {
      logger.info('Redis already connected, reusing existing connection');
      return true;
    }

    try {
      // Create Redis instance
      this.client = new Redis({
        port: this.options.port,
        host: this.options.host,
        username: this.options.username,
        password: this.options.password,
        db: this.options.db,
        retryStrategy: (times) => {
          // Custom retry strategy
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Redis connection events
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.options.onConnect();
      });

      this.client.on('error', (err) => {
        logger.error(`Redis client error: ${err.message}`);
        this.options.onError(err);
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      this.client.on('end', () => {
        logger.info('Redis client connection closed');
      });

      return true;
    } catch (err) {
      logger.error(`Redis initialization error: ${err.message}`);
      return false;
    }
  }

  /**
   * Get Redis connection status
   * @returns {boolean} - True if connected, false otherwise
   */
  isConnected() {
    return this.client && this.client.status === 'ready';
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis connection closed gracefully');
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - Key to get value for
   * @returns {Promise<any>} - Promise resolving to the value or null if not found
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Redis GET error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key - Key to set
   * @param {any} value - Value to store (will be stringified)
   * @param {number} [expiry] - Expiry time in seconds (optional)
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async set(key, value, expiry = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (expiry) {
        await this.client.set(key, stringValue, 'EX', expiry);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (err) {
      logger.error(`Redis SET error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key - Key to delete
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error(`Redis DEL error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} - Promise resolving to true if key exists
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      logger.error(`Redis EXISTS error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Set expiration time on a key
   * @param {string} key - Key to expire
   * @param {number} seconds - Seconds until expiration
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (err) {
      logger.error(`Redis EXPIRE error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Increment a key's value
   * @param {string} key - Key to increment
   * @returns {Promise<number|null>} - Promise resolving to the new value
   */
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (err) {
      logger.error(`Redis INCR error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set multiple hash fields to multiple values
   * @param {string} key - Hash key
   * @param {Object} fields - Object containing field-value pairs
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async hmset(key, fields) {
    try {
      const args = [key];
      for (const [field, value] of Object.entries(fields)) {
        args.push(
          field,
          typeof value === 'object' ? JSON.stringify(value) : value
        );
      }
      await this.client.hmset(...args);
      return true;
    } catch (err) {
      logger.error(`Redis HMSET error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Get all fields and values in a hash
   * @param {string} key - Hash key
   * @returns {Promise<Object|null>} - Promise resolving to an object with all field-value pairs
   */
  async hgetall(key) {
    try {
      return await this.client.hgetall(key);
    } catch (err) {
      logger.error(`Redis HGETALL error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Push a value to the end of a list
   * @param {string} key - List key
   * @param {any} value - Value to push
   * @returns {Promise<number|null>} - Promise resolving to the new length of the list
   */
  async rpush(key, value) {
    try {
      return await this.client.rpush(
        key,
        typeof value === 'object' ? JSON.stringify(value) : value
      );
    } catch (err) {
      logger.error(`Redis RPUSH error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get a range of elements from a list
   * @param {string} key - List key
   * @param {number} start - Start index
   * @param {number} stop - Stop index
   * @returns {Promise<Array|null>} - Promise resolving to array of elements
   */
  async lrange(key, start, stop) {
    try {
      const result = await this.client.lrange(key, start, stop);
      return result.map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (err) {
      logger.error(`Redis LRANGE error for key ${key}: ${err.message}`);
      return null;
    }
  }
}

// Export the Redis service singleton instance (not connected yet)
const redisService = new RedisService();

export default redisService;
