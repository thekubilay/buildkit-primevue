import {reactive} from "@vue/runtime-core";

const useTestFields = () => {
  const fields = reactive<any>({
    name: {
      inputId: "name",
      label: "氏名",
      defaultValue: '',
      placeholder: "氏名を入力",
      schema: "required|max:12", // Required, max 12 chars, hiragana only
      colSpan: {mobile: 1, tablet: 2, desktop: 2}, // Responsive
      class: "w-full",
    },
    type: {
      inputId: "type",
      label: "種類",
      as: "Select",
      defaultValue: 'tel',
      placeholder: "選択してください",
      schema: "required", // Required, max 12 chars, hiragana only
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      class: "w-full",
      options: ["email", "tel"]
    },
    email: {
      inputId: "email_id",
      label: "メールアドレス",
      defaultValue: '',
      placeholder: "email@example.com",
      schema: "required|email|max:100", // Required, email format, max 100 chars
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      class: "w-full",
      showWhen: {field: "type", equals: "email"},
    },
    phone: {
      inputId: "phone_id",
      label: "電話番号",
      defaultValue: '',
      placeholder: "09012345678",
      schema: "required|number", // Required, numbers only, 10-11 digits
      colSpan: {mobile: 1, tablet: 1, desktop: 1}, // Responsive
      class: "w-full",
      showWhen: {field: "type", equals: "tel"},
    },
  })

  return {
    fields
  }
}

export default useTestFields