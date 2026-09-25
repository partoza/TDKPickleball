import { Button } from '@/components/ui/button';

export const TABLE_PAGE_SIZE = 10;

export function TablePagination({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  if (total <= TABLE_PAGE_SIZE) return null;
  const first = page * TABLE_PAGE_SIZE + 1;
  const last = Math.min((page + 1) * TABLE_PAGE_SIZE, total);
  return <div className="flex items-center justify-between gap-3 border-t border-border/60 px-1 pt-4">
    <span className="text-xs text-muted-foreground">Showing {first} to {last} of {total}</span>
    <div className="flex gap-1">
      <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>Previous</Button>
      <Button type="button" variant="outline" size="sm" disabled={last >= total} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  </div>;
}
