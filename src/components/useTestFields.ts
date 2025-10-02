import {reactive} from "@vue/runtime-core";
import emails from "./emails.ts";

const useTestFields = () => {
  const fields = reactive<any>({
    gender: {
      label: "性別",
      as: "RadioButton",
      defaultValue: '',
      schema: "required",
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      class: "w-full",
      buttonType: true,
      buttonTypeClass: "w-[calc(25%-0.375rem)] rounded-md text-xs",
      // vertical: true,
      options: [
        {label: "男性", value: "male"},
        {label: "女性", value: "female"},
        {label: "その他", value: "other"}
      ]
    },
    projects: {
      label: "興味のある分野",
      as: "MultiSelect",
      defaultValue: [],
      schema: "required", // At least 1, max 3 selections
      colSpan: {mobile: 1, tablet: 2, desktop: 1}, // Responsive
      optionLabel: "name",
      optionValue: "id",
      options: [1, 2, 3, 4, 5, 6],
    },
    project: {
      inputId: "project_id",
      label: "プロジェクト",
      as: "Select",
      defaultValue: null,
      // schema: "required", // Required field
      class: "w-full",
      colSpan: {mobile: 1, tablet: 2, desktop: 1}, // Responsive
      optionLabel: "name",
      optionValue: "id",
      options: emails
    },
    desired_m2: {
      inputId: "desired_m2_id",
      label: "ご希望の間取り",
      defaultValue: '',
      as: "Select",
      className: "w-full",
      placeholder: "選択してください",
      optionLabel: "label",
      optionValue: "value",
      options: [
        {label: "〜30m2", value: 30},
        {label: "30m2〜", value: 30},
        {label: "35m2〜", value: 35},
        {label: "40m2〜", value: 40},
        {label: "45m2〜", value: 45},
        {label: "50m2〜", value: 50},
        {label: "55m2〜", value: 55},
        {label: "60m2〜", value: 60},
        {label: "65m2〜", value: 65},
        {label: "70m2〜", value: 70},
        {label: "75m2〜", value: 75},
        {label: "80m2〜", value: 80},
        {label: "85m2〜", value: 85},
        {label: "90m2〜", value: 90},
        {label: "95m2〜", value: 95},
        {label: "100m2〜", value: 100},
        {label: "120m2〜", value: 120},
        {label: "150m2〜", value: 150},
      ],
      colSpan: {desktop: 3, mobile: 1, tablet: 1},
    },
    name: {
      inputId: "name_id",
      label: "氏名",
      defaultValue: 'article',
      placeholder: "氏名を入力",
      schema: "required|max:12", // Required, max 12 chars, hiragana only
      colSpan: {mobile: 1, tablet: 2, desktop: 2}, // Responsive
      class: "w-full",
      help: "asdasdasda"
    },
    email: {
      inputId: "email_id",
      label: "メールアドレス",
      defaultValue: '',
      placeholder: "email@example.com",
      schema: "required|email|max:100", // Required, email format, max 100 chars
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
      class: "w-full",
      // hideWhen: {field: "name", equals: "article"},
    },
    phone: {
      inputId: "phone_id",
      label: "電話番号",
      defaultValue: '',
      placeholder: "09012345678",
      schema: "required|number", // Required, numbers only, 10-11 digits
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
      // showWhen: {field: "name", equals: "article"},
      class: "w-full",
    },
    birthdate: {
      inputId: "birthdate_id",
      label: "Birthdate",
      as: "DatePicker",
      defaultValue: "2023-10-05T05:23:41.036132Z",
      schema: "required",
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
      // showWhen: {field: "name", equals: "article"},
      class: "w-[55%]",
    },
    age: {
      inputId: "age_id",
      label: "年齢",
      as: "InputNumber",
      defaultValue: null,
      schema: "required|min:18|max:100", // Required, between 18-100
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
      class: "w-full",
    },
    website: {
      inputId: "website_id",
      label: "ウェブサイト",
      defaultValue: '',
      placeholder: "https://example.com",
      schema: "url", // Optional URL validation
      class: "w-full",
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
    },
    username: {
      inputId: "username_id",
      label: "ユーザー名",
      defaultValue: '',
      placeholder: "username123",
      schema: "required|min:3|max:20|romaji|nospace", // Required, 3-20 chars, romaji, no spaces
      class: "w-full",
    },
    tags: {
      inputId: "tags_id",
      label: "タグ",
      as: "MultiSelect",
      optionLabel: "label",
      optionValue: "value",
      defaultValue: [],
      colSpan: {mobile: 4, tablet: 2, desktop: 1}, // Responsive
      options: [
        {label: "テクノロジー", value: "technology"},
        {label: "デザイン", value: "design"},
      ],
      schema: "min:1|max:5", // At least 1, max 5 selections
      class: "w-full",
    },
    newsletter: {
      label: "ニュースレターを購読する",
      as: "Checkbox",
      inputId: "newsletter_id",
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      binary: true,
      defaultValue: false,
      class: "w-full"
    },
    terms: {
      label: "利用規約に同意する",
      as: "Checkbox",
      inputId: "terms_id",
      defaultValue: true,
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      binary: true,
      schema: "required", // Must be checked to submit
      class: "w-full"
    },
    interests: {
      label: "興味のある分野",
      as: "CheckboxGroup",
      defaultValue: [],
      schema: "min:1|max:3", // At least 1, max 3 selections
      colSpan: {mobile: 1, tablet: 2, desktop: 1}, // Responsive
      options: [
        {label: "テクノロジー", value: "technology"},
        {label: "デザイン", value: "design"},
      ]
    },
    content: {
      inputId: "content_id",
      label: "本文",
      as: "Editor",
      defaultValue: "this is the default value",
      schema: "min:1|max:5000",
      class: "w-full",
      editorStyle: "height: 320px",
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      placeholder: "ここに本文を入力..."
    }
  })

  return {
    fields
  }
}

export default useTestFields