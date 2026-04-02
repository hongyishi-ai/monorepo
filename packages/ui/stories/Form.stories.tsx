import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../src/components/form/input';
import { Label } from '../src/components/form/label';
import { useForm, FormProvider } from 'react-hook-form';

const meta: Meta<typeof Input> = {
  title: 'Components/Form',
  component: Input,
  tags: ['autodocs'],
};

export default meta;

export const InputDefault: StoryObj<typeof Input> = {
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="example">Email</Label>
      <Input id="example" placeholder="Enter email" />
    </div>
  ),
};

export const InputDisabled: StoryObj<typeof Input> = {
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="disabled">Disabled</Label>
      <Input id="disabled" placeholder="Disabled" disabled />
    </div>
  ),
};
