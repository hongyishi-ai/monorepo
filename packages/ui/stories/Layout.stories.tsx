import type { Meta, StoryObj } from '@storybook/react';
import { Container } from '../src/components/layout/container';
import { Stack } from '../src/components/layout/stack';

const meta: Meta = {
  title: 'Components/Layout',
};

export default meta;

export const ContainerStory: StoryObj = {
  render: () => (
    <Container maxWidth="md">
      <div className="bg-primary text-primary-foreground p-4 rounded">
        Container with maxWidth md
      </div>
    </Container>
  ),
};

export const StackStory: StoryObj = {
  render: () => (
    <Stack direction="col" gap="4" className="p-4">
      <div className="bg-primary text-primary-foreground p-4 rounded">Item 1</div>
      <div className="bg-primary text-primary-foreground p-4 rounded">Item 2</div>
      <div className="bg-primary text-primary-foreground p-4 rounded">Item 3</div>
    </Stack>
  ),
};
