'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputHTMLAttributes, useState } from 'react';

type Props = {
  fieldTitle: string;
  nameInSchema: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputWithLabel({ fieldTitle, nameInSchema, className, ...props }: Props) {
  const form = useFormContext();
  const [onFocus, setOnFocus] = useState(false);

  if (!form?.control) {
    return (
      <div className={`relative w-full ${props.disabled ? 'cursor-not-allowed' : ''}`}>
        <Label
          htmlFor={nameInSchema}
          className="absolute left-3 top-[-0.55rem] z-10 bg-bg-alt px-1 text-xs font-medium tracking-wider"
          style={{ color: 'var(--color-fg-light)' }}
        >
          {fieldTitle}
        </Label>
        <Input
          id={nameInSchema}
          className={className}
          placeholder={!onFocus ? props.placeholder : ''}
          {...props}
          onFocus={(event) => {
            setOnFocus(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setOnFocus(false);
            props.onBlur?.(event);
          }}
        />
      </div>
    );
  }

  const { error } = form.getFieldState(nameInSchema, form.formState);

  return (
    <FormField
      control={form.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem>
          <div className={`relative w-full ${props.disabled ? 'cursor-not-allowed' : ''}`}>
            <FormLabel
              htmlFor={nameInSchema}
              className={`absolute left-3 font-medium transition-all text-xs top-[-0.55rem] px-1 z-10 ${
                error?.message ? 'text-red-500' : 'tracking-wider'
              }`}
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                color: error?.message ? 'rgb(220, 38, 38)' : 'var(--color-fg-light)',
              }}
            >
              {error?.message ? error?.message : fieldTitle}
            </FormLabel>

            <FormControl>
              <Input
                id={nameInSchema}
                className={className}
                placeholder={!error?.message && !onFocus ? props.placeholder : ''}
                {...props}
                {...field}
                onFocus={() => setOnFocus(true)}
                onBlur={(e) => {
                  setOnFocus(false);
                  field.onBlur();
                }}
                onChange={(e) =>
                  field.onChange(
                    props.type === 'number'
                      ? e.target.value === ''
                        ? 0
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
}
