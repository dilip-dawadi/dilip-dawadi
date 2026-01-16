'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components//ui/textarea';
import { InputHTMLAttributes, useState } from 'react';

type Props = {
  fieldTitle: string;
  nameInSchema: string;
  className?: string;
  rows?: number;
} & InputHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaWithLabel({ fieldTitle, nameInSchema, className, ...props }: Props) {
  const form = useFormContext();
  if (!form) throw new Error('TextAreaWithLabel must be used within a FormProvider');
  const { error } = form.getFieldState(nameInSchema, form.formState);
  const [onFocus, setOnFocus] = useState(false);

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
              <Textarea
                id={nameInSchema}
                className={`text-secondary ${
                  error ? 'border-destructive placeholder:text-destructive' : ''
                } ${className}`}
                onFocus={() => setOnFocus(true)}
                placeholder={!error?.message && !onFocus ? props.placeholder : ''}
                {...props}
                {...field}
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
}
