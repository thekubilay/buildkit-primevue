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
    zipcode: {
      inputId: "zipcode",
      label: "Zipcode",
      as: "Zipcode",
      defaultValue: '5380042',
      placeholder: "000000",
      schema: "required",
      colSpan: {mobile: 1, tablet: 2, desktop: 2},
      class: "w-full",
    },
    prefecture: {
      inputId: "prefecture",
      label: "氏名",
      defaultValue: '',
      placeholder: "氏名を入力",
      colSpan: {mobile: 1, tablet: 2, desktop: 2}, // Responsive
      class: "w-full",
    },
    address: {
      inputId: "address",
      label: "氏名",
      defaultValue: '',
      placeholder: "氏名を入力",
      colSpan: {mobile: 1, tablet: 2, desktop: 2}, // Responsive
      class: "w-full",
    },
    address2: {
      inputId: "address2",
      label: "氏名",
      defaultValue: '',
      placeholder: "氏名を入力",
      colSpan: {mobile: 1, tablet: 2, desktop: 2}, // Responsive
      class: "w-full",
    },
  })

  return {
    fields
  }
}

export default useTestFields