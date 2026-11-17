import {zodResolver} from "@primevue/forms/resolvers/zod";
import {z} from "zod";
import type {FormKitProps} from "./types/FormKitProps.ts";
import {equals, includesMatch} from "./utils/visibility.ts";
import {isSeparatorField} from "./utils/isSeparator.ts";
import {messages, type Locale, type LocaleMessages} from "./locales/messages.ts";

const useFormKitValidations = (fields?: FormKitProps['fields'], locale: Locale = "ja") => {

  const m: LocaleMessages = messages[locale];

  /**
   * Name the type Zod actually received, across Zod 3 and Zod 4.
   *
   * Zod 3 put the type name on `issue.received`. Zod 4 dropped that field and carries the
   * offending value itself as `issue.input` instead (verified on zod 4.6.6: an invalid_type
   * issue has exactly `["expected", "code", "input", "inst", "schema"]`, plus `path` for an
   * object key; 4.1.x had the same keys minus `schema`). Reading only `received` left the
   * missing-value branch dead on Zod 4, so every empty required field reported a type
   * mismatch — 「無効な入力です（〇〇が必要です）」 — instead of "this field is required".
   *
   * `input` is checked with `in` rather than truthiness because a missing value IS
   * `undefined`, which is precisely the case that matters here.
   */
  const receivedTypeOf = (issue: any): string | undefined => {
    if (typeof issue?.received === 'string') return issue.received;
    if (issue && 'input' in issue) {
      if (issue.input === null) return 'null';
      if (issue.input === undefined) return 'undefined';
      return typeof issue.input;
    }
    return undefined;
  };

  const isMissing = (issue: any): boolean => {
    const received = receivedTypeOf(issue);
    return received === 'null' || received === 'undefined';
  };

  /**
   * Inline schema messages win over the error map, so a branch that hard-codes one (the
   * number and date branches below) would report "enter a number" for a field the user
   * simply left blank. Passing a function instead lets those branches fall back to the
   * required message when nothing was entered, and keep their specific wording otherwise.
   */
  const typeMessage = (whenWrongType: string) => (issue: any) =>
    isMissing(issue) ? m.required : whenWrongType;

  // Create a custom error map that doesn't affect the global Zod state
  const createCustomErrorMap = () => {
    return (issue: any, ctx: any) => {
      if (issue.code === 'invalid_type') {
        // If a value is missing/null, show a required-style message
        if (isMissing(issue)) {
          return {message: m.required};
        }
        const expected = m.typeLabels[(issue as any).expected as keyof typeof m.typeLabels] || (issue as any).expected;
        return {message: m.invalidType(expected)};
      }

      // Add specific handling for union validation errors
      if (issue.code === 'invalid_union') {
        return {message: isMissing(issue) ? m.required : m.invalidUnion};
      }

      // Handle invalid literal (for Select fields)
      if (issue.code === 'invalid_literal') {
        return {message: isMissing(issue) ? m.required : m.invalidLiteral};
      }

      // Handle invalid enum
      if (issue.code === 'invalid_enum_value') {
        return {message: isMissing(issue) ? m.required : m.invalidEnum};
      }

      // Zod 4 renamed the enum/literal mismatch codes; keep both spellings working.
      if (issue.code === 'invalid_value' || issue.code === 'invalid_option') {
        return {message: isMissing(issue) ? m.required : m.invalidEnum};
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
      // Zod 3 reads `errorMap`, Zod 4 reads `error` — supply both so the message is not
      // silently dropped, and report a blank value as missing rather than as a bad choice.
      const enumMessage = (issue: any) => {
        const value = issue && 'input' in issue ? issue.input : undefined;
        const empty = value === null || value === undefined || value === '';
        return empty ? m.required : m.selectInvalid;
      };
      return z.enum(validValues as [string, ...string[]], {
        errorMap: (issue: any) => ({message: enumMessage(issue)}),
        error: enumMessage,
      } as any);
    }

    // Check if all values are numbers
    const allNumbers = validValues.every((v: any) => typeof v === 'number');

    if (allNumbers && validValues.length > 0) {
      // For numbers, use z.union of literals with coercion
      const numberSchema = z.preprocess((v: any) => {
        // A cleared Select hands back "", which is "nothing selected", not "not a number".
        // Mapping it to undefined lets the error map report it as missing.
        if (typeof v === 'string' && v.trim() === '') return undefined;
        if (typeof v === 'string') {
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
        // As above: "" means nothing was selected, not "not a boolean".
        if (typeof v === 'string' && v.trim() === '') return undefined;
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
      // Unlike the enum / number / boolean branches above, nothing type-checks the value
      // before this refine runs, so a blank field reaches it and would be reported as an
      // invalid choice. Distinguish "nothing entered" from "not one of the options".
      {
        error: (issue: any) => {
          const value = 'input' in issue ? issue.input : undefined;
          const empty = value === null || value === undefined || value === '';
          if (empty) return m.required;
          return isRequired ? m.selectInvalid : m.selectRequired;
        },
      } as any
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

      // Separators hold no value, so they get no schema entry at all
      if (isSeparatorField(field)) return;

      // If this field should skip validation entirely (e.g., it's hidden), use z.any().optional()
      if (skipValidationForFields?.has(fieldName)) {
        schemaObject[fieldName] = z.any().optional();
        return;
      }

      let fieldSchema: z.ZodType = z.string();

      // Array-valued controls need an empty-string escape hatch, see below.
      const isArrayLike = field.type === 'array' || field.as === 'MultiSelect'
        || field.as === 'CheckboxGroup' || Array.isArray(field.defaultValue);

      // Only the schema string decides whether a field is required. `field.required` is
      // the label marker — it renders the `*` via FormKitLabel and nothing else. It used
      // to feed this flag too, which silently made a field genuinely required in 7 of 10
      // component types (InputText, Textarea, the bare default, InputNumber, DatePicker,
      // Select, RadioButton) while doing nothing for Checkbox, MultiSelect and
      // CheckboxGroup — so the same config enforced or not depending on `as`.
      let isRequired = false;
      if (field.schema) {
        const rules = parseSchemaString(field.schema);
        isRequired = rules.some(({rule}) => rule === 'required');
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
          error: typeMessage(m.numberInput)
        } as any));

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
              z.number({error: typeMessage(m.numberInput)} as any),
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
          error: typeMessage(m.dateInput)
        } as any));

        if (isRequired) {
          fieldSchema = dateCoerce;
        } else {
          fieldSchema = dateCoerce.optional().nullable();
        }
      } else if (isArrayLike) {
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

      // An empty string is this library's generic "no value": castValue returns it for a
      // blank CheckboxGroup, clear() resets string state to it, and backend column configs
      // ship `defaultValue: ""` for every field type regardless of the control. Without
      // this, a MultiSelect or CheckboxGroup that the user never touched fails the array
      // type check and reports 「無効な入力です（配列が必要です）」 — an optional field that
      // behaves as if it were required.
      //
      // Applied AFTER the schema-string rules so the loop above still sees a real ZodArray
      // and its isZodArray() branch keeps applying min/max/required.
      if (isArrayLike) {
        fieldSchema = z.preprocess(
          (v: any) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
          fieldSchema,
        );
      }

      schemaObject[fieldName] = fieldSchema;
    });

    return z.object(schemaObject);
  };

  // helper to evaluate a single visibility condition
  const evalCondition = (condition: any, values: Record<string, any>): boolean => {
    if (!condition?.field) return false;
    const left = values?.[condition.field];
    if (condition.includes !== undefined) return includesMatch(left, condition.includes);
    return equals(left, condition.equals);
  };

  // helper to evaluate conditions: leaf, array (legacy OR), { and: [...] }, { or: [...] }, nestable
  const evalConditions = (conditions: any, values: Record<string, any>): boolean => {
    if (Array.isArray(conditions)) {
      return conditions.some(c => evalConditions(c, values));
    }
    if (conditions && typeof conditions === 'object') {
      if (Array.isArray(conditions.and)) {
        return conditions.and.every((c: any) => evalConditions(c, values));
      }
      if (Array.isArray(conditions.or)) {
        return conditions.or.some((c: any) => evalConditions(c, values));
      }
    }
    return evalCondition(conditions, values);
  };

  // helper to compute visibility from field config and current values
  const isFieldVisibleByConfig = (cfg: any, values: Record<string, any>): boolean => {
    const showWhen = cfg?.showWhen;
    const hideWhen = cfg?.hideWhen;

    let visible = true;
    if (showWhen) {
      visible = evalConditions(showWhen, values);
    }
    if (hideWhen) {
      if (evalConditions(hideWhen, values)) visible = false;
    }
    return visible;
  };

  /**
   * Options handed to zodResolver, which forwards them to Zod's parse call. Zod 3 reads
   * `errorMap` there; Zod 4 ignores it and reads `error` instead (measured: an `errorMap`
   * passed per-parse is never invoked on Zod 4). Supplying both keeps the messages
   * localised on either version rather than relying solely on the global map set below.
   *
   * The per-parse `error` is also what keeps this correct on zod >= 4.6: `safeParse` there
   * builds its error lazily, on the first read of `result.error`, under whatever global map
   * is active at that moment — possibly after the `finally` below has restored the previous
   * one. The per-parse `error` travels with the parse context and is consulted before the
   * global map, so it applies whenever the issues are finalised. (zodResolver calls
   * `parseAsync`, which still finalises eagerly, so today both paths agree.)
   */
  const resolverOptions = () => {
    const map = createCustomErrorMap();
    return {errorMap: map, error: (issue: any) => (map(issue, undefined as any) as any)?.message} as any;
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
        const dynamic = zodResolver(z.object({}), resolverOptions());
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
      const dynamicResolver = zodResolver(dynamicSchema, resolverOptions());
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
