import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Task} from '../models';
import {TaskRepository} from '../repositories';
import {inject} from '@loopback/core';
import {RedisService} from '../services/redis.service';

export class TaskController {
  constructor(
    @repository(TaskRepository)
    public taskRepository : TaskRepository,
    @inject('services.RedisService')
    public redisService: RedisService,
  ) {}

  @post('/tasks')
  @response(200, {
    description: 'Task model instance',
    content: {'application/json': {schema: getModelSchemaRef(Task)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTask',
            exclude: ['id'],
          }),
        },
      },
    })
    task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const createdTask = await this.taskRepository.create(task);
    // After creating a new task, you might want to cache it
    await this.redisService.setTask(createdTask);
    return createdTask;
  }

  @get('/tasks/count')
  @response(200, {
    description: 'Task model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Task) where?: Where<Task>,
  ): Promise<Count> {
    return this.taskRepository.count(where);
  }

  @get('/tasks')
  @response(200, {
    description: 'Array of Task model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Task, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Task) filter?: Filter<Task>,
  ): Promise<Task[]> {
    return this.taskRepository.find(filter);
    // Note: Caching for this method would be more complex as it involves filters
    // You might want to implement a more sophisticated caching strategy for this
  }

  @patch('/tasks')
  @response(200, {
    description: 'Task PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
        },
      },
    })
    task: Task,
    @param.where(Task) where?: Where<Task>,
  ): Promise<Count> {
    return this.taskRepository.updateAll(task, where);
    // After updating, you might want to invalidate or update relevant cache entries
  }

  @get('/tasks/{id}')
  @response(200, {
    description: 'Task model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Task, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Task, {exclude: 'where'}) filter?: FilterExcludingWhere<Task>
  ): Promise<Task> {
    // Try to get the task from Redis first
    let task = await this.redisService.getTask(id);
    if (!task) {
      // If not in Redis, get from database
      task = await this.taskRepository.findById(id, filter);
      // Then cache it in Redis for future requests
      await this.redisService.setTask(task);
    }
    return task;
  }

  @patch('/tasks/{id}')
  @response(204, {
    description: 'Task PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
        },
      },
    })
    task: Task,
  ): Promise<void> {
    await this.taskRepository.updateById(id, task);
    // After updating, update the cache
    const updatedTask = await this.taskRepository.findById(id);
    await this.redisService.setTask(updatedTask);
  }

  @put('/tasks/{id}')
  @response(204, {
    description: 'Task PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() task: Task,
  ): Promise<void> {
    await this.taskRepository.replaceById(id, task);
    // After replacing, update the cache
    await this.redisService.setTask(task);
  }

  @del('/tasks/{id}')
  @response(204, {
    description: 'Task DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.taskRepository.deleteById(id);
    // After deleting, remove from cache
    // You'll need to add a method to RedisService to delete a task
    // await this.redisService.deleteTask(id);
  }
}