<template>
  <div class="w-full h-screen py-14 flex justify-center items-start overflow-y-scroll">
    <div class="w-[500px]">
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

import FormKit from "buildkit-primevue";
// import FormKit from "./components/formkit/FormKit.vue";
import {setFields, getPayload} from "buildkit-primevue/utils";
import type {FormKitProps} from "buildkit-primevue";

import {onMounted, reactive, ref} from "vue";

import useTestFields from "./components/useTestFields.ts";

onMounted(() => {
  const data = {
    project: "sample1",
    name: "rock",
    email: "example@gmail.com",
    content: "kubilay turgut",
    birthdate: "2023-10-05T05:23:41.036132Z",
    desired_m2: 70,
  }

  setFields(data, fields)
})

const {fields} = useTestFields()

const isLoading = ref(false)

const form = ref<Record<string, any>>({})
const FormKitArgs = reactive<FormKitProps>({
  fields: fields,
  size: "small"
})

const submit = async ({valid, states}: any): Promise<void> => {
  if (valid) {
    const payload = getPayload(states)
    console.log('Form is valid, submitting:', payload);
    // Submit logic here
  } else {
    const payload = getPayload(states)
    console.log(payload)
    // console.log('Form has validation errors:', states);
  }
}
</script>