import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CascadeDeleteDialog } from '../cascade-delete-dialog';

describe('CascadeDeleteDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: '删除药品',
    itemName: '测试药品',
    itemType: 'medicine' as const,
    dependencies: {
      transaction_count: 5,
      batch_count: 2,
    },
  };

  it('should render dialog with correct title', () => {
    render(<CascadeDeleteDialog {...defaultProps} />);

    expect(screen.getByText('删除药品')).toBeInTheDocument();
  });

  it('should display item name in description', () => {
    render(<CascadeDeleteDialog {...defaultProps} />);

    expect(screen.getByText(/测试药品/)).toBeInTheDocument();
  });

  it('should show dependency information for medicine', () => {
    render(<CascadeDeleteDialog {...defaultProps} />);

    expect(screen.getByText('库存交易记录')).toBeInTheDocument();
    expect(screen.getByText('5 条')).toBeInTheDocument();
    expect(screen.getByText('批次记录')).toBeInTheDocument();
    expect(screen.getByText('2 个')).toBeInTheDocument();
  });

  it('should show dependency information for batch', () => {
    const batchProps = {
      ...defaultProps,
      itemType: 'batch' as const,
      itemName: '测试批次',
      dependencies: {
        transaction_count: 3,
      },
    };

    render(<CascadeDeleteDialog {...batchProps} />);

    expect(screen.getByText('库存交易记录')).toBeInTheDocument();
    expect(screen.getByText('3 条')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<CascadeDeleteDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByText('删除中...')).toBeInTheDocument();
  });

  it('should show confirm button when not loading', () => {
    render(<CascadeDeleteDialog {...defaultProps} isLoading={false} />);

    expect(screen.getByText('确认删除')).toBeInTheDocument();
  });
});
