import {reactive} from "@vue/runtime-core";

const useTestFields = () => {
  const fields = reactive<any>({
    status: {
      inputId: "status_id",
      label: "ステータス",
      defaultValue: '',
      as: "Select",
      placeholder: "ステータスを選択",
      schema: "required",
      class: "w-[48%]",
      options: [
        {label: "公開中", value: "published"},
        {label: "アーカイブ", value: "archived"},
        {label: "メンテンナンス", value: "maintenance"},
      ],
      optionLabel: "label",
      optionValue: "value",
      colSpan: {desktop: 1, table: 1, mobile: 1}
    },
    name: {
      inputId: "name_id",
      label: "室名",
      defaultValue: '',
      placeholder: "室名を入力",
      schema: "required",
      class: "w-full",
      colSpan: {desktop: 1, table: 1, mobile: 1}
    },
    add_help_text: {
      inputId: "add_help_text",
      label: "ヘルプテキスト追加",
      as: "Checkbox",
      defaultValue: false,
      binary: true,
      colSpan: {desktop: 1, table: 1, mobile: 1}
    },
    help_text_type: {
      inputId: "help_text_type",
      label: "テキストタイプ",
      as: "Select",
      defaultValue: '',
      placeholder: "選択してください",
      schema: "required",
      class: "w-full",
      options: [
        {label: "テキスト", value: "text"},
        {label: "アラート", value: "alert"},
      ],
      optionLabel: "label",
      optionValue: "value",
      colSpan: {desktop: 2, table: 1, mobile: 1},
      hideWhen: {field: "add_help_text", equals: false}
    },
    help_text_position: {
      inputId: "help_text_position",
      label: "ヘルプテキスト位置",
      as: "Select",
      defaultValue: '',
      placeholder: "選択してください",
      schema: "required",
      options: [
        {label: "Top", value: "top"},
        {label: "Bottom", value: "bottom"},
      ],
      optionLabel: "label",
      optionValue: "value",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1},
      hideWhen: {field: "add_help_text", equals: false}
    },
    help_text_color: {
      inputId: "help_text_color",
      label: "ヘルプテキストカラー",
      defaultValue: '',
      placeholder: "#212121",
      schema: "required",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1},
      hideWhen:[{field: "help_text_type", equals: "alert"}, {field: "add_help_text", equals: false}]
    },
    help_text_size: {
      inputId: "help_text_size",
      label: "ヘルプテキストサイズ",
      defaultValue: '',
      placeholder: "14px",
      schema: "required",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1},
      hideWhen:[{field: "help_text_type", equals: "alert"}, {field: "add_help_text", equals: false}]
    },
    help_text: {
      inputId: "name_id",
      label: "ヘルプテキスト",
      defaultValue: '',
      placeholder: "室名を入力",
      schema: "required",
      class: "w-full",
      colSpan: {desktop: 1, table: 1, mobile: 1},
      hideWhen: {field: "add_help_text", equals: false}
    },
    zipcode: {
      inputId: "zipcode_id",
      label: "郵便番号",
      defaultValue: '',
      as: "Zipcode",
      placeholder: "1000001",
      schema: "required",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
    prefecture: {
      inputId: "prefecture_id",
      label: "都道府県",
      defaultValue: '',
      placeholder: "都道府県",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
    address: {
      inputId: "address_id",
      label: "住所",
      defaultValue: '',
      placeholder: "住所を入力",
      class: "w-full",
      colSpan: {desktop: 1, table: 1, mobile: 1}
    },
    form: {
      inputId: "form_id",
      label: "フォーム",
      defaultValue: '',
      as: "Select",
      placeholder: "フォームを選択",
      class: "w-full",
      options: [],
      optionLabel: "name",
      optionValue: "id",
      colSpan: {desktop: 1, table: 1, mobile: 1}
    },
    day_span: {
      inputId: "day_span_id",
      label: "当日からの予約不可日数",
      defaultValue: 1,
      as: "InputNumber",
      placeholder: "7",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
    cancel_validation_day_span: {
      inputId: "cancel_validation_day_span_id",
      label: "キャンセル可能日数",
      defaultValue: 1,
      as: "InputNumber",
      placeholder: "7",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
    calendar_start_at: {
      inputId: "calendar_start_at_id",
      label: "カレンダー開始週",
      defaultValue: '',
      as: "DatePicker",
      dateFormat: "yy年mm月dd日",
      placeholder: "開始週選択",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
    apply_end_at: {
      inputId: "apply_end_at_id",
      label: "終了日時",
      defaultValue: '',
      as: "DatePicker",
      placeholder: "終了日時選択",
      dateFormat: "yy年mm月dd日",
      class: "w-full",
      colSpan: {desktop: 2, table: 1, mobile: 1}
    },
  })

  return {
    fields
  }
}

export default useTestFields