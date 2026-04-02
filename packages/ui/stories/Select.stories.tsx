import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../src/components/form/select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj<typeof Select> = {
  render: () => (
    <div className="w-80">
      <Select placeholder="Select an option">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </Select>
    </div>
  ),
};

export const Disabled: StoryObj<typeof Select> = {
  render: () => (
    <div className="w-80">
      <Select disabled placeholder="Disabled select">
        <option value="1">Option 1</option>
      </Select>
    </div>
  ),
};
