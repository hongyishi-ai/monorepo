import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../src/components/card/card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p>Card content</p>
    </Card>
  ),
};
