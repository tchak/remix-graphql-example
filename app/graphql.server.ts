import 'reflect-metadata';
import {
  buildSchemaSync,
  Field,
  ObjectType,
  InputType,
  ID,
  Resolver,
  Query,
  Mutation,
  Arg,
} from 'type-graphql';
import Level from 'level-ts';
import { nanoid } from 'nanoid';

const db = new Level<{ id: string; title: string; checked: boolean }>(
  './db/tasks'
);

@ObjectType()
class Task {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => Boolean)
  checked!: boolean;
}

@Resolver()
class QueryResolver {
  @Query(() => [Task])
  tasks(): Promise<Task[]> {
    return db.all();
  }
}

@ObjectType()
class TaskMutationPayload {
  @Field(() => Task, { nullable: true })
  task?: Task;

  @Field(() => String, { nullable: true })
  error?: string;
}

@InputType()
class AddTaskInput {
  @Field(() => String)
  title!: string;
}

@InputType()
class ToggleTaskInput {
  @Field(() => ID)
  id!: string;

  @Field(() => Boolean)
  checked!: boolean;
}

@InputType()
class RemoveTaskInput {
  @Field(() => ID)
  id!: string;
}

@Resolver(() => TaskMutationPayload)
class MutationResolver {
  @Mutation(() => TaskMutationPayload)
  async addTask(
    @Arg('input', () => AddTaskInput) { title }: AddTaskInput
  ): Promise<TaskMutationPayload> {
    try {
      const id = nanoid();
      const task = await db.put(id, { id, title, checked: false });
      return { task };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  @Mutation(() => TaskMutationPayload)
  async toggleTask(
    @Arg('input', () => ToggleTaskInput) { id, checked }: ToggleTaskInput
  ): Promise<TaskMutationPayload> {
    try {
      const task = await db.merge(id, { checked: checked });
      return { task };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  @Mutation(() => TaskMutationPayload)
  async removeTask(
    @Arg('input', () => RemoveTaskInput) { id }: RemoveTaskInput
  ): Promise<TaskMutationPayload> {
    try {
      const task = await db.get(id);
      await db.del(id);
      return { task };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
}

export const schema = buildSchemaSync({
  resolvers: [QueryResolver, MutationResolver],
  emitSchemaFile: { path: './schema.graphql' },
  dateScalarMode: 'isoDate',
});
