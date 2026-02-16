import {zodResolver} from "@primevue/forms/resolvers/zod";
import {z} from "zod";
import type {FormKitProps} from "./types/FormKitProps.ts";
import {equals, includesMatch} from "./utils/visibility.ts";
import {messages, type Locale, type LocaleMessages} from "./locales/messages.ts";

const useFormKitValidations = (fields?: FormKitProps['fields'], locale: Locale = "ja") => {

  const m: LocaleMessages = messages[locale];

  // Create a custom error map that doesn't affect the global Zod state
  const createCustomErrorMap = () => {
    return (issue: any, ctx: any) => {
      if (issue.code === 'invalid_type') {
        // If a value is missing/null, show a required-style message
        if ((issue.received as any) === 'null' || (issue.received as any) === 'undefined') {
          return {message: m.required};
        }
        const expected = m.typeLabels[(issue as any).expected as keyof typeof m.typeLabels] || (issue as any).expected;
        return {message: m.invalidType(expected)};
      }

      // Add specific handling for union validation errors
      if (issue.code === 'invalid_union') {
        return {message: m.invalidUnion};
      }

      // Handle invalid literal (for Select fields)
      if (issue.code === 'invalid_literal') {
        return {message: m.invalidLiteral};
      }

      // Handle invalid enum
      if (issue.code === 'invalid_enum_value') {
        return {message: m.invalidEnum};
      }

      // Fallback to a context default or generic message
      return {message: (ctx && (ctx as any).defaultError) || m.fallback};
    };
  };

  const customRuleSchema: { [key: string]: (param?: string) => z.ZodType } = {
    // Basic required rule
    required: () => z.union([
      z.string().min(1, {message: m.required}),
      z.number(),
      z.array(z.any()).min(1, {message: m.required})
    ]),

    // Email validation
    email: () => z.string().email({message: m.email}),

    // Min length/value validation
    min: (param?: string) => {
      const minValue = param ? parseInt(param) : 1;
      return z.string().min(minValue, {message: m.min(minValue)});
    },

    // Max length/value validation
    max: (param?: string) => {
      const maxValue = param ? parseInt(param) : 255;
      return z.string().max(maxValue, {message: m.max(maxValue)});
    },

    // Katakana validation - supports both full-width and half-width katakana
    katakana: () => z.string().refine(
      (value) => /^[ア-ヶー゠-ヿｦ-ﾟ\s]*$/.test(value),
      {message: m.katakana}
    ),

    // Hiragana validation
    hiragana: () => z.string().refine(
      (value) => /^[あ-んー\s]*$/.test(value),
      {message: m.hiragana}
    ),

    // Number-only validation
    number: () => z.string().refine(
      (value) => value === '' || /^\d+$/.test(value),
      {message: m.numberOnly}
    ),

    // Romaji validation
    romaji: () => z.string().refine(
      (value) => value.length === 0 || /^[a-zA-Z0-9_-]+$/.test(value),
      {message: m.romaji}
    ),

    // No space validation
    nospace: () => z.string().refine(
      (value) => !/\s/.test(value),
      {message: m.nospace}
    ),

    // Length validation (exact)
    length: (param?: string) => {
      const length = param ? parseInt(param) : 1;
      return z.string().length(length, {message: m.length(length)});
    },

    // Between validation
    between: (param?: string) => {
      const [min, max] = param ? param.split(',').map(p => parseInt(p.trim())) : [0, 255];
      return z.string().min(min, {message: m.betweenMin(min)})
        .max(max, {message: m.betweenMax(max)});
    },

    // URL validation
    url: () => z.string().url({message: m.url}),

    // Regex validation
    regex: (param?: string) => {
      if (!param) return z.string();
      try {
        const regex = new RegExp(param);
        return z.string().refine(
          (value) => regex.test(value),
          {message: m.regex}
        );
      } catch {
        return z.string();
      }
    },
  };

  const parseSchemaString = (schema: string): Array<{ rule: string, param?: string }> => {
    return schema.split('|').map(rule => {
      const [name, param] = rule.split(':');
      return {rule: name.trim(), param: param?.trim()};
    });
  };

  // Helper function to check Zod schema types
  const isZodString = (schema: z.ZodType): schema is z.ZodString => {
    return schema instanceof z.ZodString;
  };

  const isZodBoolean = (schema: z.ZodType): schema is z.ZodBoolean => {
    return schema instanceof z.ZodBoolean;
  };

  const isZodArray = (schema: z.ZodType): schema is z.ZodArray<any> => {
    return schema instanceof z.ZodArray;
  };

  // Helper function to create Select field schema with proper option validation
  const createSelectSchema = (field: any, isRequired: boolean = false): z.ZodType => {
    const options = field.options || [];

    // For non-required select fields, always allow null, undefined, and empty string
    if (!isRequired) {
      return z.any().optional();
    }

    if (!Array.isArray(options) || options.length === 0) {
      // Use z.any() for required fields without options to avoid type issues
      return z.any().refine(
        (value) => value !== null && value !== undefined && value !== '',
        {message: m.selectRequired}
      );
    }

    // Extract valid values from options respecting field.optionValue (fallback to `value`)
    const valueKey = field?.optionValue ?? 'value';
    const validValues = options
      .map((opt: any) => {
        if (opt && typeof opt === 'object') {
          const val = opt[valueKey] ?? opt.value;
          return val !== undefined ? val : opt;
        }
        return opt;
      })
      .filter((v: any) => v !== undefined && v !== null);

    if (validValues.length === 0) {
      return z.any().refine(
        (value) => value !== null && value !== undefined && value !== '',
        {message: m.selectRequired}
      );
    }

    // Check if all values are strings
    const allStrings = validValues.every((v: any) => typeof v === 'string');

    if (allStrings && validValues.length > 0) {
      // Use z.enum for string values - this is more reliable across Zod instances
      //@ts-ignore
      return z.enum(validValues as [string, ...string[]], {
        errorMap: () => ({message: m.selectInvalid})
      });
    }

    // Check if all values are numbers
    const allNumbers = validValues.every((v: any) => typeof v === 'number');

    if (allNumbers && validValues.length > 0) {
      // For numbers, use z.union of literals with coercion
      const numberSchema = z.preprocess((v: any) => {
        if (typeof v === 'string' && v !== '') {
          const parsed = Number(v);
          return isNaN(parsed) ? v : parsed;
        }
        return v;
      }, z.number());

      return numberSchema.refine(
        (value) => validValues.includes(value),
        {message: m.selectInvalid}
      );
    }

    // Check if all values are booleans
    const allBooleans = validValues.every((v: any) => typeof v === 'boolean');

    if (allBooleans && validValues.length > 0) {
      // For booleans, use z.union of literals with coercion
      const booleanSchema = z.preprocess((v: any) => {
        if (typeof v === 'string') {
          if (v === 'true') return true;
          if (v === 'false') return false;
        }
        return v;
      }, z.boolean());

      return booleanSchema.refine(
        (value) => validValues.includes(value),
        {message: m.selectInvalid}
      );
    }

    // For mixed types or other cases, use a refine approach with type coercion
    return z.preprocess((v: any) => {
      // Handle string to number conversion
      if (typeof v === 'string' && v !== '') {
        const asNumber = Number(v);
        if (!isNaN(asNumber) && validValues.some((val: any) => typeof val === 'number')) {
          return asNumber;
        }
        // Handle string to boolean conversion
        if (v === 'true' && validValues.includes(true)) return true;
        if (v === 'false' && validValues.includes(false)) return false;
      }
      return v;
    }, z.any()).refine(
      (value) => {
        if (value === null || value === undefined || value === '') {
          return false; // Required field cannot be empty
        }

        return validValues.some(v => {
          // Strict equality check
          if (v === value) return true;

          // Type coercion for form values
          if (typeof v === 'number' && typeof value === 'string') {
            return v === Number(value);
          }
          if (typeof v === 'string' && typeof value === 'number') {
            return Number(v) === value;
          }
          if (typeof v === 'boolean' && typeof value === 'string') {
            return (v === true && value === 'true') || (v === false && value === 'false');
          }

          return false;
        });
      },
      {message: isRequired ? m.selectInvalid : m.selectRequired}
    );
  };

  // Helper function to apply custom validation rules
  const applyCustomValidation = (fieldSchema: z.ZodString, rule: string, param?: string): z.ZodString => {
    switch (rule) {
      case 'katakana':
        return fieldSchema.refine(
          (value) => !value || /^[ア-ヶー゠-ヿｦ-ﾟ\s]*$/.test(value),
          {message: m.katakana}
        );
      case 'hiragana':
        return fieldSchema.refine(
          (value) => !value || /^[あ-んー\s]*$/.test(value),
          {message: m.hiragana}
        );
      case 'number':
        return fieldSchema.refine(
          (value) => !value || /^\d+$/.test(value),
          {message: m.numberOnly}
        );
      case 'romaji':
        return fieldSchema.refine(
          (value) => !value || /^[a-zA-Z0-9_-]+$/.test(value),
          {message: m.romaji}
        );
      case 'nospace':
        return fieldSchema.refine(
          (value) => !value || !/\s/.test(value),
          {message: m.nospace}
        );
      case 'regex':
        if (param) {
          try {
            const regex = new RegExp(param);
            return fieldSchema.refine(
              (value) => !value || regex.test(value),
              {message: m.regex}
            );
          } catch (error) {
            console.warn(`Invalid regex pattern: ${param}`);
          }
        }
        return fieldSchema;
      default:
        return fieldSchema;
    }
  };

  /**
   * Creates a dynamic Zod schema based on field configurations
   * @param fields - Field configurations
   * @param skipValidationForFields - Optional set of field names to skip ALL validation for (used for hidden fields)
   */
  const createDynamicSchema = (fields: FormKitProps['fields'], skipValidationForFields?: Set<string>) => {
    const schemaObject: { [key: string]: z.ZodType } = {};

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];

      // If this field should skip validation entirely (e.g., it's hidden), use z.any().optional()
      if (skipValidationForFields?.has(fieldName)) {
        schemaObject[fieldName] = z.any().optional();
        return;
      }

      let fieldSchema: z.ZodType = z.string();

      // Parse schema string to determine if field is required
      let isRequired = field.required || false;
      if (field.schema) {
        const rules = parseSchemaString(field.schema);
        isRequired = isRequired || rules.some(({rule}) => rule === 'required');
      }

      // Start with a base type based on field configuration
      if (field.type === 'number' || field.as === 'InputNumber') {
        const numberCoerce = z.preprocess((v: any) => {
          if (v === '' || v === undefined) return undefined;
          if (v === null) return null;
          if (typeof v === 'string') {
            const n = Number(v);
            return Number.isFinite(n) ? n : v;
          }
          return v;
        }, z.number({
          message: m.numberInput
        }));

        if (isRequired) {
          fieldSchema = numberCoerce;
        } else {
          // For non-required number fields, allow empty string, null, or undefined without error.
          fieldSchema = z.preprocess(
            (v: any) => {
              if (v === '' || v === undefined) return undefined;
              if (v === null) return null;
              if (typeof v === 'string') {
                const n = Number(v);
                return Number.isFinite(n) ? n : v;
              }
              return v;
            },
            z.union([
              z.number({message: m.numberInput}),
              z.undefined(),
              z.null(),
            ])
          );
        }
      } else if (field.as === 'Checkbox') {
        // For checkboxes, use preprocessing to handle string values and ensure boolean type
        fieldSchema = z.preprocess((v: any) => {
          // Convert string representations to boolean
          if (v === 'true') return true;
          if (v === 'false') return false;
          if (v === '' || v === null || v === undefined) return false;
          // If already boolean, return as-is
          if (typeof v === 'boolean') return v;
          // Default to false for any other value
          return false;
        }, z.boolean());
      } else if (field.as === 'DatePicker') {
        const dateCoerce = z.preprocess((v: any) => {
          if (v === '' || v === undefined) return undefined;
          if (v === null) return null;
          if (typeof v === 'string') {
            const t = Date.parse(v);
            return isNaN(t) ? v : new Date(t);
          }
          return v;
        }, z.date({
          message: m.dateInput
        }));

        if (isRequired) {
          fieldSchema = dateCoerce;
        } else {
          fieldSchema = dateCoerce.optional().nullable();
        }
      } else if (field.type === 'array' || field.as === 'MultiSelect' || field.as === 'CheckboxGroup' || Array.isArray(field.defaultValue)) {
        // For array-like fields (e.g., MultiSelect), allow null/undefined when not required
        if (isRequired) {
          fieldSchema = z.array(z.any());
        } else {
          fieldSchema = z.array(z.any()).optional().nullable();
        }
      } else if (
        field.as === 'Select' ||
        field.as === 'RadioButton' ||
        (Array.isArray((field as any).options) && field.as !== 'MultiSelect' && field.as !== 'CheckboxGroup')
      ) {
        // Use the improved Select schema creation function
        fieldSchema = createSelectSchema(field, isRequired);
      } else {
        // For string fields, handle optional vs required differently
        if (isRequired) {
          fieldSchema = z.string().min(1, {message: m.required});
        } else {
          // For non-required string fields, accept any string including empty
          fieldSchema = z.union([z.string(), z.null(), z.undefined()]).optional();
        }
      }

      // Parse schema string if it exists - only apply rules for required fields or specific validations
      if (field.schema && isRequired) {
        const rules = parseSchemaString(field.schema);

        rules.forEach(({rule, param}) => {
          if (customRuleSchema[rule]) {
            // Handle different field types using proper type checking
            if (isZodString(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = fieldSchema.min(1, {message: m.required});
              } else if (rule === 'email') {
                fieldSchema = fieldSchema.email({message: m.email});
              } else if (rule === 'min') {
                const minValue = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.min(minValue, {message: m.min(minValue)});
              } else if (rule === 'max') {
                const maxValue = param ? parseInt(param) : 255;
                fieldSchema = fieldSchema.max(maxValue, {message: m.max(maxValue)});
              } else if (rule === 'length') {
                const length = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.length(length, {message: m.length(length)});
              } else if (rule === 'between') {
                const [min, max] = param ? param.split(',').map(p => parseInt(p.trim())) : [0, 255];
                fieldSchema = fieldSchema
                  .min(min, {message: m.betweenMin(min)})
                  .max(max, {message: m.betweenMax(max)});
              } else if (rule === 'url') {
                fieldSchema = fieldSchema.refine(
                  (value) => {
                    if (!value) return true; // Allow empty values for optional fields
                    try {
                      new URL(value);
                      return true;
                    } catch {
                      return false;
                    }
                  },
                  {message: m.url}
                );
              } else if (rule === 'regex' && param) {
                try {
                  const regex = new RegExp(param);
                  fieldSchema = fieldSchema.refine(
                    (value) => !value || regex.test(value),
                    {message: m.regex}
                  );
                } catch (error) {
                  console.warn(`Invalid regex pattern: ${param}`);
                }
              } else if (['katakana', 'hiragana', 'number', 'romaji', 'nospace'].includes(rule)) {
                // Handle custom refine rules using our helper function
                fieldSchema = applyCustomValidation(fieldSchema, rule, param);
              }
            } else if (isZodArray(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = fieldSchema.min(1, {message: m.required});
              } else if (rule === 'min') {
                const minValue = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.min(minValue, {message: m.arrayMin(minValue)});
              } else if (rule === 'max') {
                const maxValue = param ? parseInt(param) : 10;
                fieldSchema = fieldSchema.max(maxValue, {message: m.arrayMax(maxValue)});
              }
            } else if (isZodBoolean(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = fieldSchema.refine((v) => v === true, {message: m.required});
              }
            }
          }
        });
      }

      schemaObject[fieldName] = fieldSchema;
    });

    return z.object(schemaObject);
  };

  // helper to compute visibility from field config and current values
  const isFieldVisibleByConfig = (cfg: any, values: Record<string, any>): boolean => {
    const showWhen = cfg?.showWhen;
    const hideWhen = cfg?.hideWhen;

    let visible = true;
    if (showWhen?.field) {
      const left = values?.[showWhen.field];
      if (showWhen.includes !== undefined) visible = includesMatch(left, showWhen.includes);
      else visible = equals(left, showWhen.equals);
    }
    if (hideWhen?.field) {
      const left = values?.[hideWhen.field];
      let shouldHide = false;
      if (hideWhen.includes !== undefined) shouldHide = includesMatch(left, hideWhen.includes);
      else shouldHide = equals(left, hideWhen.equals);
      if (shouldHide) visible = false;
    }
    return visible;
  };

  // Wrap resolver to temporarily set global Zod errorMap and build visibility-aware schema
  const resolver = async ({values, name}: any) => {
    const getErrorMap = (z as any).getErrorMap as (() => any) | undefined;
    const setErrorMap = (z as any).setErrorMap as ((map: any) => void) | undefined;

    const prevMap = getErrorMap ? getErrorMap() : undefined;
    const customMap = createCustomErrorMap();

    if (setErrorMap) setErrorMap(customMap);
    try {
      // If no fields provided, validate against empty object
      if (!fields) {
        const dynamic = zodResolver(z.object({}), {errorMap: createCustomErrorMap()});
        return await (dynamic as any)({values, name});
      }

      // Determine which fields are currently hidden and should skip ALL validation
      const hiddenFields = new Set<string>();
      Object.entries(fields as any).forEach(([fname, cfg]: any) => {
        const visible = isFieldVisibleByConfig(cfg, values || {});
        if (!visible) {
          hiddenFields.add(fname);
        }
      });

      // Create a fresh schema where hidden fields skip all validation
      const dynamicSchema = createDynamicSchema(fields, hiddenFields);
      const dynamicResolver = zodResolver(dynamicSchema, {errorMap: createCustomErrorMap()});
      return await (dynamicResolver as any)({values, name});
    } finally {
      if (setErrorMap) setErrorMap(prevMap);
    }
  };

  return {
    resolver,
    customRuleSchema,
    createDynamicSchema,
    parseSchemaString
  }
}

export default useFormKitValidations;
