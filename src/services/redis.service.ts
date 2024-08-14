import {createClient} from 'redis';
import {Provider} from '@loopback/core';
import {Task} from '../models';

export class RedisService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    // this.client = createClient({url: 'redis://localhost:6379'});
    this.client = createClient(
      {
        url: 'redis://localhost:6379',
        socket: {
          host: 'localhost',
          port: 6379,
        }
      },
    );
    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect().catch(console.error);
  }

  async getTask(id: number): Promise<Task | null> {
    console.log('Getting task from redis');
    const taskString = await this.client.get(`task:${id}`);
    return taskString ? JSON.parse(taskString) : null;
  }

  async setTask(task: Task): Promise<void> {
    console.log('Adding task to redis');
    await this.client.set(`task:${task.id}`, JSON.stringify(task));
  }

  async deleteTask(id: number): Promise<void> {
    console.log('Deleting task from redis');
    await this.client.del(`task:${id}`);
  }
}

export class RedisServiceProvider implements Provider<RedisService> {
  constructor() {}

  value(): RedisService {
    return new RedisService();
  }
}