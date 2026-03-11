<template>
  <div class="w-full h-screen py-14 flex justify-center items-start overflow-y-scroll">
    <div style="width: 500px">
      <FormKit v-model="form" v-bind="FormKitArgs" @submit="submit">
        <template #footer>
          <Button type="submit" size="small" label="保存" class="w-[48%] ml-auto" :loading="isLoading" @click="submit"/>
        </template>
      </FormKit>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import FormKit from "./components/formkit/FormKit.vue";

import {onMounted, reactive, ref} from "vue";

import {getPayload} from "./components/formkit/utils/getPayload.ts";
import {setFields} from "./components/formkit/utils/setFields.ts";

import type {FormKitProps} from "./components/formkit/types/FormKitProps.ts";

import useTestFields from "./components/useTestFields.ts";


onMounted(() => {
  // const data = {
  //
  // }
  setFields({
    "id": 2852709981,
    "order_num": 0,
    "name": "「インテリアコーディネーターと巡る『家具ショップツアー』」申し込みフォーム",
    "add_help_text": false,
    "help_text_type": "text",
    "help_text_position": "top",
    "help_text": null,
    "help_text_color": null,
    "help_text_size": null,
    "zipcode": "",
    "prefecture": "",
    "address": "",
    "app_name": "viterve",
    "slot_min_time": "11:00",
    "slot_max_time": "17:00",
    "calendar_start_at": "2026-02-27T15:00:00Z",
    "apply_end_at": "2026-02-28T15:00:00Z",
    "status": "published",
    "day_span": 1,
    "cancel_validation_day_span": 1,
    "holidays": null,
    "extra_data": null,
    "created_at": "2026-02-05T02:12:20.178000Z",
    "updated_at": "2026-02-06T09:46:05.043585Z",
    "project": null,
    "form": 158
  }, fields)

})

const {fields} = useTestFields()

const isLoading = ref(false)

const form = ref<Record<string, any>>({})
const FormKitArgs = reactive<FormKitProps>({
  fields: fields,
  size: "small",
  locale: "en",
})

const submit = async ({valid, states}: any): Promise<void> => {
  console.log("isvalid:", valid)
  const payload = getPayload(states, fields)
  console.log(payload)


}
</script>