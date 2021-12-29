import type { LoaderFunction, ActionFunction } from 'remix';
import { useLoaderData, Form, useFetcher, useTransition } from 'remix';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import {
  query,
  mutation,
  GetTasksDocument,
  GetTasksQuery,
  AddTaskDocument,
  ToggleTaskDocument,
  RemoveTaskDocument,
} from '~/urql.server';

const AddTaskInput = z.object({
  actionType: z.literal('AddTask'),
  title: z.string(),
});
const ToggleTaskInput = z.object({
  actionType: z.literal('ToggleTask'),
  id: z.string(),
  checked: z.enum(['true', 'false']).transform((checked) => checked == 'true'),
});
const RemoveTaskInput = z.object({
  actionType: z.literal('RemoveTask'),
  id: z.string(),
});
const Input = z.union([AddTaskInput, ToggleTaskInput, RemoveTaskInput]);

export const loader: LoaderFunction = () => query(GetTasksDocument);
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const input = Input.parse(Object.fromEntries(formData));

  switch (input.actionType) {
    case 'AddTask':
      return mutation(AddTaskDocument, { title: input.title });
    case 'ToggleTask':
      return mutation(ToggleTaskDocument, {
        id: input.id,
        checked: input.checked,
      });
    case 'RemoveTask':
      return mutation(RemoveTaskDocument, { id: input.id });
  }
};

export default function IndexRoute() {
  const data = useLoaderData<GetTasksQuery>();
  const transition = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (
      transition.type == 'actionReload' &&
      transition.submission.formData.get('actionType') == 'AddTask'
    ) {
      formRef.current?.reset();
    }
  }, [transition.type]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-xl">
        <h1 className="text-4xl">Tasks</h1>

        <Form ref={formRef} method="post" replace className="flex mt-3">
          <input type="hidden" name="actionType" value="AddTask" />
          <input
            type="text"
            name="title"
            className="flex-grow focus:outline-none"
            autoFocus
            defaultValue=""
            readOnly={transition.type == 'actionSubmission'}
          />
          <button
            type="submit"
            className="ml-3"
            disabled={transition.type == 'actionSubmission'}
          >
            Add
          </button>
        </Form>

        <ul className="mt-3">
          {data.tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: GetTasksQuery['tasks'][0] }) {
  const fetcher = useFetcher();

  return (
    <li className="flex items-center py-2 md:py-4">
      <input
        type="checkbox"
        defaultChecked={task.checked}
        onClick={({ currentTarget: { checked } }) => {
          fetcher.submit(
            {
              actionType: 'ToggleTask',
              id: task.id,
              checked: checked ? 'true' : 'false',
            },
            { action: '?index', method: 'post', replace: true }
          );
        }}
      />
      <div className="ml-3 flex-grow">{task.title}</div>
      <button
        type="button"
        className="ml-3"
        disabled={fetcher.state == 'submitting'}
        onClick={() => {
          fetcher.submit(
            { actionType: 'RemoveTask', id: task.id },
            { action: '?index', method: 'post', replace: true }
          );
        }}
      >
        Delete
      </button>
    </li>
  );
}
