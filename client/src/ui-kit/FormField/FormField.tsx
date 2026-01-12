import type { ChangeEvent, ComponentPropsWithoutRef } from "react";

type FormFieldData = ComponentPropsWithoutRef<'input'> & {
    cb: (value: string) => void,
    error?: string,
    labelText?: string,
    className?: string,

}

export const FormField = ({ id, type, value, labelText, placeholder, cb, error, required, className = '', ...inputProps }: FormFieldData) => {
    return <label className={`form-field ${className}`}>
        { labelText }
        <input id={id} type={type} required={required} className="form-input" placeholder={placeholder} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => cb(event.target.value)} {...inputProps} />
        { error ? <p className="error-feedback">{ error }</p> : null }
    </label>
}