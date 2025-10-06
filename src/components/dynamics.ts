const dynamic: any = [
  {
    "id": 1140,
    "is_visible": true,
    "order_num": 0,
    "label": "姓",
    "key": "last_name",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "last_name": {
        "as": "InputText",
        "id": 1140,
        "help": "",
        "class": "w-full",
        "label": "姓",
        "schema": "required",
        "colSpan": {
          "table": 1,
          "mobile": 1,
          "desktop": 2
        },
        "inputId": "last_name_id",
        "placeholder": "入力してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.075637Z",
    "updated_at": "2025-10-06T02:09:17.109799Z",
    "form": 184
  },
  {
    "id": 1141,
    "is_visible": true,
    "order_num": 1,
    "label": "名",
    "key": "first_name",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "first_name": {
        "as": "InputText",
        "id": 1141,
        "help": "",
        "class": "w-full",
        "label": "名",
        "schema": "required|katakana",
        "colSpan": {
          "table": 1,
          "mobile": 1,
          "desktop": 2
        },
        "inputId": "first_name_id",
        "placeholder": "入力してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.081905Z",
    "updated_at": "2025-10-06T02:09:17.111202Z",
    "form": 184
  },
  {
    "id": 1142,
    "is_visible": true,
    "order_num": 2,
    "label": "メールアドレス",
    "key": "email",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "email": {
        "as": "InputText",
        "id": 1142,
        "help": "",
        "class": "w-full",
        "label": "メールアドレス",
        "schema": "email|required",
        "colSpan": {
          "table": 1,
          "mobile": 1,
          "desktop": 1
        },
        "inputId": "email_id",
        "placeholder": "入力してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.085886Z",
    "updated_at": "2025-10-06T02:09:17.112504Z",
    "form": 184
  },
  {
    "id": 1143,
    "is_visible": true,
    "order_num": 3,
    "label": "電話番号",
    "key": "tel",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "tel": {
        "as": "InputText",
        "id": 1143,
        "help": "",
        "class": "w-[48%]",
        "label": "電話番号",
        "schema": "required",
        "colSpan": {
          "table": 1,
          "mobile": 1,
          "desktop": 1
        },
        "inputId": "tel_id",
        "placeholder": "入力してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.089898Z",
    "updated_at": "2025-10-06T02:09:17.113780Z",
    "form": 184
  },
  {
    "id": 1144,
    "is_visible": true,
    "order_num": 4,
    "label": "部屋番号",
    "key": "room_number",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "room_number": {
        "as": "InputText",
        "id": 1144,
        "help": "",
        "class": "w-[48%]",
        "label": "部屋番号",
        "schema": "required",
        "colSpan": {
          "table": 1,
          "mobile": 1,
          "desktop": 1
        },
        "inputId": "room_number_id",
        "placeholder": "入力してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.093996Z",
    "updated_at": "2025-10-06T02:09:17.114972Z",
    "form": 184
  },
  {
    "id": 1145,
    "is_visible": true,
    "order_num": 5,
    "label": "ご相談内容",
    "key": "consultance",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "consultance": {
        "as": "MultiSelect",
        "id": 1145,
        "class": "w-full",
        "label": "ご相談内容",
        "schema": "",
        "colSpan": {
          "mobile": 1,
          "tablet": 1,
          "desktop": 1
        },
        "inputId": "consultance",
        "options": [
          {
            "label": "インターネット",
            "value": "internet"
          },
          {
            "label": "火災保険、地震保険",
            "value": "insurance"
          },
          {
            "label": "登記",
            "value": "registration"
          },
          {
            "label": "引越",
            "value": "moveout"
          },
          {
            "label": "マンション管理",
            "value": "management"
          },
          {
            "label": "賃貸、売却相談",
            "value": "rentalsales"
          },
          {
            "label": "その他",
            "value": "other"
          }
        ],
        "optionLabel": "label",
        "optionValue": "value",
        "placeholder": "選択してください",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.098762Z",
    "updated_at": "2025-10-06T02:09:17.116265Z",
    "form": 184
  },
  {
    "id": 1146,
    "is_visible": true,
    "order_num": 6,
    "label": "その他",
    "key": "other",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "other": {
        "as": "Textarea",
        "id": 1146,
        "class": "w-full",
        "label": "その他",
        "schema": "required",
        "colSpan": {
          "mobile": 1,
          "tablet": 1,
          "desktop": 1
        },
        "inputId": "other",
        "required": true,
        "showWhen": {
          "field": "consultance",
          "equals": "other"
        },
        "placeholder": "ご相談内容に「その他」をご選択された方は、ご相談したい内容をご記入ください。",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.102563Z",
    "updated_at": "2025-10-06T02:09:17.117681Z",
    "form": 184
  },
  {
    "id": 1147,
    "is_visible": true,
    "order_num": 7,
    "label": "ご参加前に確認しておきたいこと",
    "key": "questions",
    "edit_role": "dev",
    "data_type": "InputText",
    "extra_data": {
      "questions": {
        "as": "Textarea",
        "id": 1147,
        "class": "w-full",
        "label": "ご参加前に確認しておきたいこと",
        "schema": "",
        "colSpan": {
          "mobile": 1,
          "tablet": 1,
          "desktop": 1
        },
        "inputId": "questions",
        "placeholder": "例：私の相談内容における所要時間目安を知りたい",
        "defaultValue": ""
      }
    },
    "created_at": "2025-10-06T02:09:17.106419Z",
    "updated_at": "2025-10-06T02:09:17.118957Z",
    "form": 184
  }
]

export default dynamic