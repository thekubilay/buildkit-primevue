import {zodResolver} from "@primevue/forms/resolvers/zod";
import {z} from "zod";
import type {FormKitProps} from "./types/FormKitProps.ts";

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

    // Katakana validation
    katakana: () => z.string().refine(
      (value) => /^[ア-ヶーｦ-ﾟ\s]*$/.test(value),
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

  const isZodNumber = (schema: z.ZodType): schema is z.ZodNumber => {
    return schema instanceof z.ZodNumber;
  };

  const isZodBoolean = (schema: z.ZodType): schema is z.ZodBoolean => {
    return schema instanceof z.ZodBoolean;
  };

  const isZodDate = (schema: z.ZodType): schema is z.ZodDate => {
    return schema instanceof z.ZodDate;
  };

  const isZodNullableNumber = (schema: z.ZodType): schema is z.ZodNullable<z.ZodNumber> => {
    return schema instanceof (z as any).ZodNullable && (schema as any)._def?.innerType instanceof z.ZodNumber;
  };

  const isZodArray = (schema: z.ZodType): schema is z.ZodArray<any> => {
    return schema instanceof z.ZodArray;
  };

  // Helper function to create Select field schema with proper option validation
  const createSelectSchema = (field: any, isRequired: boolean = false): z.ZodType => {
    const options = field.options || [];

    if (!Array.isArray(options) || options.length === 0) {
      // If no options provided, fall back to string validation
      if (isRequired) {
        return z.string().min(1, {message: "必須項目です"});
      } else {
        return z.string().optional();
      }
    }

    // Extract valid values from options
    const validValues = options.map((opt: any) => opt.value);

    if (validValues.length === 0) {
      if (isRequired) {
        return z.string().min(1, {message: "必須項目です"});
      } else {
        return z.string().optional();
      }
    }

    // Create a union of literal values for the options
    let literalSchemas;
    if (validValues.length === 1) {
      literalSchemas = [z.literal(validValues[0])];
    } else {
      literalSchemas = validValues.map((value: any) => {
        if (typeof value === 'string') return z.literal(value);
        if (typeof value === 'number') return z.literal(value);
        if (typeof value === 'boolean') return z.literal(value);
        return z.literal(value);
      });
    }

    // Add an empty string option for non-required fields
    //@ts-ignore
    if (!isRequired) {
      literalSchemas.push(z.literal(''));
      //@ts-ignore
      literalSchemas.push(z.undefined());
      //@ts-ignore
      literalSchemas.push(z.null());
    }

    //@ts-ignore
    return z.union(literalSchemas as [z.ZodTypeAny, ...z.ZodTypeAny[]]);
  };

  // Helper function to apply custom validation rules
  const applyCustomValidation = (fieldSchema: z.ZodString, rule: string, param?: string): z.ZodString => {
    switch (rule) {
      case 'katakana':
        return fieldSchema.refine(
          (value) => !value || /^[ア-ヶーｦ-ﾟ\s]*$/.test(value),
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
        fieldSchema = z.number().nullable();
      } else if (field.as === 'Checkbox') {
        fieldSchema = z.boolean();
      } else if (field.as === 'DatePicker') {
        fieldSchema = z.date().nullable();
      } else if (field.type === 'array' || field.as === 'MultiSelect' || field.as === 'CheckboxGroup' || Array.isArray(field.defaultValue)) {
        fieldSchema = z.array(z.any());
      } else if (
        field.as === 'Select' ||
        field.as === 'RadioButton' ||
        (Array.isArray((field as any).options) && field.as !== 'MultiSelect' && field.as !== 'CheckboxGroup')
      ) {
        // Use the new Select schema creation function
        fieldSchema = createSelectSchema(field, isRequired);
      } else {
        // For string fields, handle optional vs required differently
        if (isRequired) {
          fieldSchema = z.string().min(1, {message: "必須項目です"});
        } else {
          fieldSchema = z.string();
        }
      }

      // Parse schema string if it exists
      if (field.schema) {
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
            } else if (isZodDate(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = (fieldSchema as z.ZodDate).nullable().refine((v) => v instanceof Date, {message: "必須項目です"});
              }
            } else if (isZodNumber(fieldSchema)) {
              if (rule === 'required') {
                fieldSchema = (fieldSchema as z.ZodNumber).nullable().refine((v) => v !== null && v !== undefined, {message: "必須項目です"});
              } else if (rule === 'min') {
                const minValue = param ? parseFloat(param) : 0;
                fieldSchema = (fieldSchema as z.ZodNumber).min(minValue, {message: `${minValue}以上で入力してください`});
              } else if (rule === 'max') {
                const maxValue = param ? parseFloat(param) : 1000000;
                fieldSchema = (fieldSchema as z.ZodNumber).max(maxValue, {message: `${maxValue}以下で入力してください`});
              }
            } else if (isZodNullableNumber(fieldSchema)) {
              if (rule === 'min') {
                const minValue = param ? parseFloat(param) : 0;
                fieldSchema = (fieldSchema as any).refine((v: number | null) => v === null || v >= minValue, {message: `${minValue}以上で入力してください`});
              } else if (rule === 'max') {
                const maxValue = param ? parseFloat(param) : 1000000;
                fieldSchema = (fieldSchema as any).refine((v: number | null) => v === null || v <= maxValue, {message: `${maxValue}以下で入力してください`});
              }
            }
          }
        });
      }

      // Handle making fields optional - this is the key fix
      if (!isRequired) {
        if (isZodString(fieldSchema)) {
          // Simply make the string optional - don't use complex unions
          fieldSchema = fieldSchema.optional();
        } else if (isZodNumber(fieldSchema)) {
          fieldSchema = (fieldSchema as z.ZodNumber).nullable().optional();
        } else if (isZodDate(fieldSchema)) {
          fieldSchema = (fieldSchema as z.ZodDate).nullable().optional();
        } else if (isZodArray(fieldSchema)) {
          fieldSchema = fieldSchema.optional();
        } else if (isZodBoolean(fieldSchema)) {
          fieldSchema = fieldSchema.optional();
        } else {
          // For Select and other types, make them optional
          fieldSchema = fieldSchema.optional();
        }
      }

      schemaObject[fieldName] = fieldSchema;
    });

    return z.object(schemaObject);
  };

  // Create resolver with custom error map applied locally
  const resolver = fields ? zodResolver(
    createDynamicSchema(fields),
    {
      errorMap: createCustomErrorMap()
    }
  ) : zodResolver(z.object({}), {errorMap: createCustomErrorMap()});

  return {
    resolver,
    customRuleSchema,
    createDynamicSchema,
    parseSchemaString
  }
}

export default useFormKitValidations;