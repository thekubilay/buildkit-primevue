import {zodResolver} from "@primevue/forms/resolvers/zod";
import {z} from "zod";
import type {FormKitProps} from "./types/FormKitProps.ts";
import {equals, includesMatch} from "./utils/visibility.ts";

const useFormKitValidations = (fields?: FormKitProps['fields']) => {

  // Create a custom error map that doesn't affect the global Zod state
  const createCustomErrorMap = () => {
    return (issue: any, ctx: any) => {
      if (issue.code === 'invalid_type') {
        // If a value is missing/null, show a required-style message
        if ((issue.received as any) === 'null' || (issue.received as any) === 'undefined') {
          return {message: '必須項目です'};
        }
        const typeLabel: Record<string, string> = {
          string: '文字列',
          number: '数値',
          boolean: '真偽値',
          array: '配列',
          date: '日付',
          object: 'オブジェクト'
        };
        const expected = typeLabel[(issue as any).expected] || (issue as any).expected;
        return {message: `無効な入力です（${expected}が必要です）`};
      }

      // Add specific handling for union validation errors
      if (issue.code === 'invalid_union') {
        return {message: '選択された値が無効です'};
      }

      // Handle invalid literal (for Select fields)
      if (issue.code === 'invalid_literal') {
        return {message: '有効な選択肢を選んでください'};
      }

      // Handle invalid enum
      if (issue.code === 'invalid_enum_value') {
        return {message: '有効な選択肢を選んでください'};
      }

      // Fallback to a context default or generic message
      return {message: (ctx && (ctx as any).defaultError) || '入力値が無効です'};
    };
  };

  const customRuleSchema: { [key: string]: (param?: string) => z.ZodType } = {
    // Basic required rule
    required: () => z.union([
      z.string().min(1, {message: "必須項目です"}),
      z.number(),
      z.array(z.any()).min(1, {message: "必須項目です"})
    ]),

    // Email validation
    email: () => z.string().email({message: "有効なメールアドレスを入力してください"}),

    // Min length/value validation
    min: (param?: string) => {
      const minValue = param ? parseInt(param) : 1;
      return z.string().min(minValue, {message: `最低${minValue}文字で入力してください`});
    },

    // Max length/value validation
    max: (param?: string) => {
      const maxValue = param ? parseInt(param) : 255;
      return z.string().max(maxValue, {message: `最大${maxValue}文字で入力してください`});
    },

    // Katakana validation - supports both full-width and half-width katakana
    katakana: () => z.string().refine(
      (value) => /^[ア-ヶー゠-ヿｦ-ﾟ\s]*$/.test(value),
      {message: "カタカナと空白のみで入力してください"}
    ),

    // Hiragana validation
    hiragana: () => z.string().refine(
      (value) => /^[あ-んー\s]*$/.test(value),
      {message: "ひらがなと空白のみで入力してください"}
    ),

    // Number-only validation
    number: () => z.string().refine(
      (value) => value === '' || /^\d+$/.test(value),
      {message: "数字のみで入力してください"}
    ),

    // Romaji validation
    romaji: () => z.string().refine(
      (value) => value.length === 0 || /^[a-zA-Z0-9_-]+$/.test(value),
      {message: "ローマ字、数字、アンダースコア、ハイフンのみで入力してください"}
    ),

    // No space validation
    nospace: () => z.string().refine(
      (value) => !/\s/.test(value),
      {message: "空白を含まないでください"}
    ),

    // Length validation (exact)
    length: (param?: string) => {
      const length = param ? parseInt(param) : 1;
      return z.string().length(length, {message: `${length}文字で入力してください`});
    },

    // Between validation
    between: (param?: string) => {
      const [min, max] = param ? param.split(',').map(p => parseInt(p.trim())) : [0, 255];
      return z.string().min(min, {message: `${min}文字以上で入力してください`})
        .max(max, {message: `${max}文字以下で入力してください`});
    },

    // URL validation
    url: () => z.string().url({message: "有効なURLを入力してください"}),

    // Regex validation
    regex: (param?: string) => {
      if (!param) return z.string();
      try {
        const regex = new RegExp(param);
        return z.string().refine(
          (value) => regex.test(value),
          {message: "入力形式が正しくありません"}
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
        { message: "必須項目です" }
      );
    }

    // Extract valid values from options
    const validValues = options.map((opt: any) =>
      (opt && typeof opt === 'object' && 'value' in opt) ? opt.value : opt
    ).filter((v: any) => v !== undefined && v !== null);

    if (validValues.length === 0) {
      return z.any().refine(
        (value) => value !== null && value !== undefined && value !== '',
        { message: "必須項目です" }
      );
    }

    // Check if all values are strings
    const allStrings = validValues.every((v: any) => typeof v === 'string');

    if (allStrings && validValues.length > 0) {
      // Use z.enum for string values - this is more reliable across Zod instances
      //@ts-ignore
      return z.enum(validValues as [string, ...string[]], {
        errorMap: () => ({ message: "有効な選択肢を選んでください" })
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
        { message: "有効な選択肢を選んでください" }
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
        { message: "有効な選択肢を選んでください" }
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
      { message: isRequired ? "有効な選択肢を選んでください" : "必須項目です" }
    );
  };

  // Helper function to apply custom validation rules
  const applyCustomValidation = (fieldSchema: z.ZodString, rule: string, param?: string): z.ZodString => {
    switch (rule) {
      case 'katakana':
        return fieldSchema.refine(
          (value) => !value || /^[ア-ヶー゠-ヿｦ-ﾟ\s]*$/.test(value),
          {message: "カタカナと空白のみで入力してください"}
        );
      case 'hiragana':
        return fieldSchema.refine(
          (value) => !value || /^[あ-んー\s]*$/.test(value),
          {message: "ひらがなと空白のみで入力してください"}
        );
      case 'number':
        return fieldSchema.refine(
          (value) => !value || /^\d+$/.test(value),
          {message: "数字のみで入力してください"}
        );
      case 'romaji':
        return fieldSchema.refine(
          (value) => !value || /^[a-zA-Z0-9_-]+$/.test(value),
          {message: "ローマ字、数字、アンダースコア、ハイフンのみで入力してください"}
        );
      case 'nospace':
        return fieldSchema.refine(
          (value) => !value || !/\s/.test(value),
          {message: "空白を含まないでください"}
        );
      case 'regex':
        if (param) {
          try {
            const regex = new RegExp(param);
            return fieldSchema.refine(
              (value) => !value || regex.test(value),
              {message: "入力形式が正しくありません"}
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

  const createDynamicSchema = (fields: FormKitProps['fields']) => {
    const schemaObject: { [key: string]: z.ZodType } = {};

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
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
          message: "数値を入力してください"
        }));

        if (isRequired) {
          fieldSchema = numberCoerce;
        } else {
          // For non-required number fields, allow empty string, null, or undefined without error.
          // Important: Use preprocess with a union so that optionality is checked AFTER preprocessing,
          // avoiding the case where '' becomes undefined and still triggers z.number().
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
              z.number({ message: "数値を入力してください" }),
              z.undefined(),
              z.null(),
            ])
          );
        }
      } else if (field.as === 'Checkbox') {
        fieldSchema = z.boolean();
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
          message: "日付を選択してください"
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
          fieldSchema = z.string().min(1, {message: "必須項目です"});
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
                fieldSchema = fieldSchema.min(1, {message: "必須項目です"});
              } else if (rule === 'email') {
                fieldSchema = fieldSchema.email({message: "有効なメールアドレスを入力してください"});
              } else if (rule === 'min') {
                const minValue = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.min(minValue, {message: `最低${minValue}文字で入力してください`});
              } else if (rule === 'max') {
                const maxValue = param ? parseInt(param) : 255;
                fieldSchema = fieldSchema.max(maxValue, {message: `最大${maxValue}文字で入力してください`});
              } else if (rule === 'length') {
                const length = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.length(length, {message: `${length}文字で入力してください`});
              } else if (rule === 'between') {
                const [min, max] = param ? param.split(',').map(p => parseInt(p.trim())) : [0, 255];
                fieldSchema = fieldSchema
                  .min(min, {message: `${min}文字以上で入力してください`})
                  .max(max, {message: `${max}文字以下で入力してください`});
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
                  {message: "有効なURLを入力してください"}
                );
              } else if (rule === 'regex' && param) {
                try {
                  const regex = new RegExp(param);
                  fieldSchema = fieldSchema.refine(
                    (value) => !value || regex.test(value),
                    {message: "入力形式が正しくありません"}
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
                fieldSchema = fieldSchema.min(1, {message: "必須項目です"});
              } else if (rule === 'min') {
                const minValue = param ? parseInt(param) : 1;
                fieldSchema = fieldSchema.min(minValue, {message: `最低${minValue}項目を選択してください`});
              } else if (rule === 'max') {
                const maxValue = param ? parseInt(param) : 10;
                fieldSchema = fieldSchema.max(maxValue, {message: `最大${maxValue}項目まで選択できます`});
              }
            } else if (isZodBoolean(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = fieldSchema.refine((v) => v === true, {message: "必須項目です"});
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

  const removeRequiredFromSchemaString = (schema?: string): string | undefined => {
    if (!schema) return schema;
    // split by | and remove tokens that are exactly 'required' or 'required()'
    const parts = schema.split('|').map(s => s.trim()).filter(Boolean);
    const filtered = parts.filter(p => !/^required\s*\(?\s*\)?$/.test(p));
    return filtered.join(' | ');
  };

  // Wrap resolver to temporarily set global Zod errorMap and build visibility-aware schema
  const resolver = async ({ values, name }: any) => {
    const getErrorMap = (z as any).getErrorMap as (() => any) | undefined;
    const setErrorMap = (z as any).setErrorMap as ((map: any) => void) | undefined;

    const prevMap = getErrorMap ? getErrorMap() : undefined;
    const jpMap = createCustomErrorMap();

    if (setErrorMap) setErrorMap(jpMap);
    try {
      // If no fields provided, validate against empty object
      if (!fields) {
        const dynamic = zodResolver(z.object({}), { errorMap: createCustomErrorMap() });
        return await (dynamic as any)({ values, name });
      }

      // Build a fields copy where hidden fields are not required and do not include required in schema
      const adjustedFields: any = {};
      Object.entries(fields as any).forEach(([fname, cfg]: any) => {
        const visible = isFieldVisibleByConfig(cfg, values || {});
        const copy: any = { ...cfg };
        if (!visible) {
          copy.required = false;
          copy.schema = removeRequiredFromSchemaString(copy.schema);
        }
        adjustedFields[fname] = copy;
      });

      // Create a fresh schema using adjusted fields and validate
      const dynamicSchema = createDynamicSchema(adjustedFields);
      const dynamicResolver = zodResolver(dynamicSchema, { errorMap: createCustomErrorMap() });
      return await (dynamicResolver as any)({ values, name });
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