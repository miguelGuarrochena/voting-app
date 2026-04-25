import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface FormErrors {
  [fieldName: string]: string;
}

export interface UseFormValidationOptions {
  showToast?: boolean;
  toastMessage?: string;
  scrollToFirstError?: boolean;
  t?: (key: string, params?: Record<string, any>) => string;
}

export function useFormValidation(
  validationRules: ValidationRules,
  options: UseFormValidationOptions = {}
) {
  const {
    showToast = true,
    toastMessage = 'Faltan campos obligatorios',
    scrollToFirstError = true,
    t,
  } = options;

  const [errors, setErrors] = useState<FormErrors>({});
  const fieldRefs = useRef<Record<string, HTMLElement>>({});

  const registerField = useCallback((fieldName: string, element: HTMLElement | null) => {
    if (element) {
      fieldRefs.current[fieldName] = element;
    }
  }, []);

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return t ? t('versus.requiredField') : 'Este campo es obligatorio';
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // Min length validation
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return t ? t('versus.minLength', { n: rules.minLength }) : `Debe tener al menos ${rules.minLength} caracteres`;
    }

    // Max length validation
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return t ? t('versus.maxLength', { n: rules.maxLength }) : `Debe tener como máximo ${rules.maxLength} caracteres`;
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return t ? t('versus.invalidFormat') : 'Formato inválido';
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return null;
  }, [validationRules, t]);

  const validateForm = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    // Validate all fields
    for (const fieldName in validationRules) {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    }

    setErrors(newErrors);

    if (hasErrors) {
      // Show toast notification
      if (showToast) {
        toast.error(toastMessage);
      }

      // Scroll to first error
      if (scrollToFirstError) {
        const firstErrorField = Object.keys(newErrors)[0];
        const element = fieldRefs.current[firstErrorField];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }

      return false;
    }

    return true;
  }, [validationRules, validateField, showToast, toastMessage, scrollToFirstError]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateForm,
    validateField,
    clearErrors,
    clearFieldError,
    registerField,
  };
}
