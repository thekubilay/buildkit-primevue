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
  setFields({zipcode:5380042}, fields)

})

const {fields} = useTestFields()

const isLoading = ref(false)

const form = ref<Record<string, any>>({})
const FormKitArgs = reactive<FormKitProps>({
  fields: fields,
  size: "small"
})

const submit = async ({valid, states}: any): Promise<void> => {
  console.log("isvalid:", valid)
  const payload = getPayload(states, fields)
  console.log(payload)


}
</script>