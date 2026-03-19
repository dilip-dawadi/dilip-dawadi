import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectProps } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';

type SearchableSelectWithLabelProps = SearchableSelectProps & {
  fieldTitle: string;
  nameInSchema: string;
  wrapperClassName?: string;
};

export function SearchableSelectWithLabel({
  fieldTitle,
  nameInSchema,
  wrapperClassName,
  ...props
}: SearchableSelectWithLabelProps) {
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <Label
        htmlFor={nameInSchema}
        className="absolute left-3 top-[-0.55rem] z-10 bg-bg-alt px-1 text-xs font-medium tracking-wider"
        style={{ color: 'var(--color-fg-light)' }}
      >
        {fieldTitle}
      </Label>
      <SearchableSelect id={nameInSchema} {...props} />
    </div>
  );
}
