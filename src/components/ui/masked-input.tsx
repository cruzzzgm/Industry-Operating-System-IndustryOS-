import * as React from "react";
import { NumericFormat, PatternFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** R$ 1.234,56 */
export const MoneyInputBr = React.forwardRef<
  HTMLInputElement,
  {
    value: number | "";
    onValueChange: (value: number | "") => void;
    id?: string;
    name?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
  }
>(({ value, onValueChange, className, id, name, disabled, placeholder }, ref) => (
  <NumericFormat
    customInput={Input}
    getInputRef={ref}
    id={id}
    name={name}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(className)}
    thousandSeparator="."
    decimalSeparator=","
    prefix="R$ "
    decimalScale={2}
    fixedDecimalScale
    allowNegative
    value={value === "" ? "" : value}
    onValueChange={vals => {
      onValueChange(vals.floatValue ?? "");
    }}
  />
));
MoneyInputBr.displayName = "MoneyInputBr";

export const CnpjInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onValueChange: (formatted: string) => void;
    id?: string;
    name?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
  }
>(({ value, onValueChange, className, id, name, disabled, placeholder }, ref) => (
  <PatternFormat
    customInput={Input}
    getInputRef={ref}
    format="##.###.###/####-##"
    value={value}
    onValueChange={vals => onValueChange(vals.formattedValue)}
    id={id}
    name={name}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(className)}
  />
));
CnpjInput.displayName = "CnpjInput";

/** (00) 00000-0000 — celular BR */
export const CellPhoneBrInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onValueChange: (formatted: string) => void;
    id?: string;
    name?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
  }
>(({ value, onValueChange, className, id, name, disabled, placeholder }, ref) => (
  <PatternFormat
    customInput={Input}
    getInputRef={ref}
    format="(##) #####-####"
    value={value}
    onValueChange={vals => onValueChange(vals.formattedValue)}
    id={id}
    name={name}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(className)}
  />
));
CellPhoneBrInput.displayName = "CellPhoneBrInput";

/** 00000-000 — CEP BR */
export const CepInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onValueChange: (formatted: string) => void;
    id?: string;
    name?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
  }
>(({ value, onValueChange, className, id, name, disabled, placeholder }, ref) => (
  <PatternFormat
    customInput={Input}
    getInputRef={ref}
    format="#####-###"
    value={value}
    onValueChange={vals => onValueChange(vals.formattedValue)}
    id={id}
    name={name}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(className)}
  />
));
CepInput.displayName = "CepInput";

/** (00) 0000-0000 — telefone fixo BR */
export const PhoneBrInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onValueChange: (formatted: string) => void;
    id?: string;
    name?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
  }
>(({ value, onValueChange, className, id, name, disabled, placeholder }, ref) => (
  <PatternFormat
    customInput={Input}
    getInputRef={ref}
    format="(##) ####-####"
    value={value}
    onValueChange={vals => onValueChange(vals.formattedValue)}
    id={id}
    name={name}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(className)}
  />
));
PhoneBrInput.displayName = "PhoneBrInput";
