import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../src/components/button/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'success',
        'warning',
        'error',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Cancel',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Save Draft',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Edit',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Learn more',
    variant: 'link',
  },
};

export const Success: Story = {
  args: {
    children: 'Confirm',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Proceed',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Reject',
    variant: 'error',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    variant: 'default',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    variant: 'default',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const Icon: Story = {
  args: {
    children: '🔍',
    size: 'icon',
    variant: 'default',
  },
};
