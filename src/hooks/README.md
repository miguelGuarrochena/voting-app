# Sistema Global de Validación de Formularios

Este sistema proporciona validación consistente y feedback de errores en toda la aplicación.

## Uso Básico

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';

function MyForm() {
  const { t } = useLanguage();

  // 1. Definir reglas de validación
  const validationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  };

  // 2. Inicializar el hook
  const { errors, validateField, clearErrors, registerField } = useFormValidation(validationRules, {
    showToast: true,
    toastMessage: t('common.completeRequiredFields'),
    scrollToFirstError: true,
    t,
  });

  // 3. En el handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cada campo
    const titleError = validateField('title', title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    const emailError = validateField('email', email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Si todo está válido, proceder
    await submitForm();
  };

  // 4. En el JSX del input
  return (
    <input
      ref={(el) => registerField('title', el)}
      value={title}
      onChange={(e) => {
        setTitle(e.target.value);
        if (errors.title) clearErrors();
      }}
      className={errors.title ? 'border-red-500' : ''}
    />
    {errors.title && <p className="text-red-600">{errors.title}</p>}
  );
}
```

## Reglas de Validación Disponibles

- `required`: Campo obligatorio
- `minLength`: Longitud mínima
- `maxLength`: Longitud máxima
- `pattern`: Expresión regular
- `custom`: Función de validación personalizada

## Traducciones Requeridas

Agrega estas claves a tus archivos de locale:

```json
{
  "requiredField": "Este campo es obligatorio",
  "minLength": "Debe tener al menos {n} caracteres",
  "maxLength": "Debe tener como máximo {n} caracteres",
  "invalidFormat": "Formato inválido",
  "completeRequiredFields": "Por favor completa todos los campos obligatorios"
}
```

## Comportamiento

1. **Validación en submit**: Siempre validar antes de enviar
2. **Feedback visible**: Toast de error cuando la validación falla
3. **Scroll al error**: Lleva el foco al primer campo con error
4. **Sin fallos silenciosos**: Todo intento de acción genera feedback visible

## Aplicación a Otros Formularios

Aplicar este sistema a:
- Creación de polls (`/src/components/create/CreatePollForm.tsx`)
- Rankings (`/src/app/ranking/[token]/page.tsx`)
- Ratings (`/src/app/ratings/create/page.tsx`)
- Cualquier formulario nuevo
