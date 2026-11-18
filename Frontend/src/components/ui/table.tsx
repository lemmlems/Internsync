import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(function Table(
  { className, ...props },
  ref,
) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table ref={ref} data-slot="table" className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
});

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableHeader(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
});

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
});

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableFooter(
  { className, ...props },
  ref,
) {
  return <tfoot ref={ref} data-slot="table-footer" className={cn("border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />;
});

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(function TableRow(
  { className, ...props },
  ref,
) {
  return <tr ref={ref} data-slot="table-row" className={cn("border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />;
});

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(function TableHead(
  { className, ...props },
  ref,
) {
  return <th ref={ref} data-slot="table-head" className={cn("h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />;
});

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(function TableCell(
  { className, ...props },
  ref,
) {
  return <td ref={ref} data-slot="table-cell" className={cn("p-3 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />;
});

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
