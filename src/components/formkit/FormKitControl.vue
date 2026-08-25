<template>
  <!-- CheckboxGroup rendering -->
  <div v-if="restAs === 'CheckboxGroup' && hasOptions" class="bk-group" :class="[classNameGroup, { 'bk-group--wrap': isButtonType }]">
    <label v-for="(opt, i) in options" :key="i" :for="`${name}-${i}`" class="bk-group-label"
           :class="[buttonTypeClass, buttonTypeClassActiveClass(opt.value)]">
      <component :is="PrimeCheckbox" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <span :class="{ 'bk-text-sm': !isButtonType }">{{ opt.label }}</span>
    </label>
  </div>

  <!-- RadioButton group rendering -->
  <div v-else-if="restAs === 'RadioButton' && hasOptions" class="bk-group bk-group--wrap" :class="classNameGroup">
    <label v-for="(opt, i) in options" :key="i" :for="`${name}-${i}`" class="bk-radio-label"
           :class="[buttonTypeClass, buttonTypeClassActiveClass(opt.value)]">
      <component :is="PrimeRadioButton" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <span>{{ opt.label }}</span>
    </label>
  </div>

  <div v-else-if="restAs === 'Editor'" class="bk-group" :class="classNameGroup">
    <Editor v-bind="bindings" :size="size"/>
  </div>

  <IconField v-else-if="restAs === 'Zipcode'">
    <InputText :name="name" v-bind="bindings" :size="size"/>
    <InputIcon v-if="!isLoading" class="bk-clickable" @click="setAddress(formApi)">
      <svg v-if="!zipcodeSearchIcon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <i v-else :class="zipcodeSearchIcon"/>
    </InputIcon>
    <InputIcon v-else>
      <svg v-if="!zipcodeLoadingIcon" class="bk-spin" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
      <i v-else :class="zipcodeLoadingIcon"/>
    </InputIcon>
  </IconField>

  <!-- icon version component -->
  <IconField v-else-if="isIconVersion">
    <InputIcon v-if="iconLeft" :class="iconLeft"/>
    <component :is="component" :name="name" v-bind="bindings" :size="size" />
    <InputIcon v-if="iconRight" :class="iconRight"/>
  </IconField>

  <!-- direct component -->
  <component v-else :is="component" :name="name" v-bind="bindings" :size="size"/>
</template>

<script setup lang="ts">
import InputText from "primevue/inputtext"
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Editor from "primevue/editor";

import * as PrimeVue from 'primevue';
import {computed, inject, onUnmounted, provide, ref, type PropType} from 'vue';
import useZipcodeHelpers from "./useZipcodeHelpers.ts";

const props = defineProps({
  formApi: Object as PropType<any>,
  rest: Object as PropType<any>,
  label: String as PropType<string>,
  inputId: String as PropType<string>,
  size: String as PropType<"small" | "medium" | "large">,
});

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);
const $fcDynamicForm: any = inject('$fcDynamicForm', undefined);

const {isLoading, setAddress} = useZipcodeHelpers()

const name = computed(() => $fcDynamicFormField?.name || "");

// A field may carry its own `size` to opt out of the form-level one. The merge has to happen
// here rather than being left to `v-bind="bindings"`: FormKit always passes a resolved `size`
// (it defaults the prop to "medium"), and every branch applies `:size` after the bindings
// object, so the form value would win over the field value in every case. `size` is therefore
// kept out of `bindings` entirely — this computed is the single channel.
const size = computed(() => props.rest?.size ?? props.size)

// Track the current field value reactively to style active radio button wrapper
const currentValue = ref<any>(undefined);

let stopWatch: any = null;

if ($fcDynamicForm && name.value) {
  try {
    // initialize and watch this field's value
    stopWatch = $fcDynamicForm.watchFieldValue(name.value, (val: any) => {
      currentValue.value = val;
    });
  } catch {
  }
}

onUnmounted(() => {
  try {
    if (typeof stopWatch === 'function') stopWatch();
  } catch {
  }
});

const component = computed(() => {
  const key = props.rest?.as || "InputText";
  const resolved = (PrimeVue as any)[key];
  return resolved || key;
});

const zipcodeSearchIcon = computed(() => props.rest?.zipcodeSearchIcon || null)
const zipcodeLoadingIcon = computed(() => props.rest?.zipcodeLoadingIcon || null)

const iconLeft = props.rest?.iconLeft || null
const iconRight = props.rest?.iconRight || null
const isIconVersion = props.rest?.iconLeft || props.rest?.iconRight

const classNameGroup = computed(() => {
  return {
    "bk-flex-col": props.rest?.vertical
  }
})

const isButtonType = computed(() => !!props.rest?.buttonType)

const buttonTypeClass = computed(() => {
  const extra = (props.rest as any)?.buttonTypeClass || '';
  return {
    'bk-button-option': isButtonType.value,
    [extra]: !!extra
  }
})

// CheckboxGroup holds an array of the checked values while RadioButton holds a single value,
// so membership — not equality — is what "this option is selected" means for the group case.
const isOptionActive = (val: any) => Array.isArray(currentValue.value)
  ? currentValue.value.includes(val)
  : val === currentValue.value;

const buttonTypeClassActiveClass = computed(() => (val: any) => {
  return {
    'bk-button-option--active': isButtonType.value && isOptionActive(val),
    'bk-button-option--inactive': isButtonType.value && !isOptionActive(val)
  }
})

const restAs = computed(() => props.rest?.as)

// The component that actually receives `bindings`. Two template branches render a fixed
// component rather than the one `as` resolves to, and both must be reflected here or the
// id lands on the wrong prop.
const boundComponent = computed(() => {
  if (restAs.value === "Zipcode") return InputText;
  if (restAs.value === "Editor") return Editor;
  return component.value;
})

/**
 * Does this component declare an `inputId` prop? PrimeVue builds its components with
 * `extends`, so the prop can sit several levels up the chain — walk it. A resolved value
 * that is just a string (an unresolved component name) has no props and answers false,
 * which correctly falls back to a plain `id`.
 */
function acceptsInputIdProp(candidate: any): boolean {
  const seen = new Set<any>();
  let current = candidate;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const props = current.props;
    if (Array.isArray(props)) {
      if (props.includes("inputId")) return true;
    } else if (props && Object.prototype.hasOwnProperty.call(props, "inputId")) {
      return true;
    }
    current = current.extends || current.mixins?.[0];
  }
  return false;
}

// DatePicker/Calendar render a full InputText internally. That InputText resolves its
// $formName through the injected $pcFormField (FormKitField's <FormField :name>), so it
// registers on the Form a second time even when we pass name: undefined. Two consequences:
// its onInput/onChange write the raw DOM string into form state on every keystroke, and
// once the field is emptied BaseEditableHolder's $formDefaultValue fallback reads the stale
// Date back out of <Form :initial-values> and re-applies it — the field cannot be cleared in
// edit mode. Shadowing the inject cuts that second registration (register(undefined) is a
// no-op that adds no key to _states), leaving modelValue/update:modelValue as the single
// channel. The field's own state still exists via FormKitField's <FormField :name>.
const isDateLike = ["DatePicker", "Calendar"].includes(props.rest?.as)
if (isDateLike) provide('$pcFormField', undefined)
const options = computed(() => props.rest?.options || [])
const hasOptions = computed(() => Array.isArray(options.value) && options.value.length > 0)

const PrimeCheckbox = (PrimeVue as any).Checkbox
const PrimeRadioButton = (PrimeVue as any).RadioButton

const bindings = computed(() => {
  const binds: any = {}

  // `required` is a label marker, not a validation flag (see useFormKitValidations). If it
  // reached the input it would land on the DOM as the native `required` attribute and the
  // browser would block submission — reintroducing exactly the behaviour the flag is meant
  // not to have. FormKit.vue already destructures it out of `rest`, but this component is
  // exported and can be mounted directly, so it filters defensively too.
  // `as` selects the component above; it is never an input prop itself.
  // `iconLeft`/`iconRight` pick the IconField branch, `buttonType`/`buttonTypeClass` drive the
  // option-pill classes, and `vertical` stacks a checkbox/radio group — all five are read
  // straight off `rest` above, and none is a prop of any control reachable through `as`, so
  // left in they land on the DOM as stray attributes (`iconleft="pi pi-user"`). VirtualScroller
  // is the one PrimeVue component that declares a `vertical` prop, but it is a list renderer
  // configured through `virtualScrollerOptions`, never a form control mounted via `as`.
  // `size` is resolved by the `size` computed and applied through the explicit `:size` binding
  // on every branch; leaving it here too would bind it twice.
  const disallowedProps = new Set(["as", "defaultValue", "schema", "showWhen", "hideWhen", "colSpan", "zipcodeSearchIcon", "zipcodeLoadingIcon", "required", "size", "iconLeft", "iconRight", "buttonType", "buttonTypeClass", "vertical"]);

  Object.keys(props.rest || {}).forEach(k => {
    if (disallowedProps.has(k)) {
      // skip non-input props that can conflict with controlled value handling
      return;
    }
    if (["class", "className"].includes(k)) {
      binds["class"] = props.rest[k];
    } else {
      binds[k] = props.rest[k]
    }
  })

  // The id must not depend on whether the caller wrote an explicit `as`. This used to be
  // assigned inside the loop above under `k === "as"`, so a field relying on the default
  // InputText — `{ label, inputId, defaultValue }` with no `as` — never received one, and
  // the `for` attribute FormKitLabel emits pointed at nothing.
  //
  // Which prop to use is decided by asking the component, not by a hard-coded list.
  // PrimeVue components that wrap their real control in a container (Select, MultiSelect,
  // DatePicker, InputNumber, Checkbox, RadioButton, ToggleSwitch, Password, …) declare an
  // `inputId` prop and bind it to the focusable element; a plain `id` would land on the
  // wrapper instead and the label would point at something you cannot focus. Components
  // without that prop (InputText, Textarea, Slider, Editor) take `id` directly.
  if (props.inputId) {
    if (acceptsInputIdProp(boundComponent.value)) binds["inputId"] = props.inputId;
    else binds["id"] = props.inputId;
  }

  // Ensure full width by default for most inputs
  if (!["Checkbox", "RadioButton", "CheckboxGroup"].includes(props.rest?.as)) {
    binds["class"] = "bk-w-full"
  }

  // Special-case Date-like inputs: bind modelValue from current form state so the initial Date
  // shows up, and push every change back through setFieldValue. Together with the shadowed
  // $pcFormField inject above this is the only channel into form state, so raw input strings
  // never leak into it. Because the inject is shadowed, BaseEditableHolder can no longer derive
  // $invalid on its own — pass it explicitly so date fields keep their invalid styling.
  if (isDateLike) {
    binds["name"] = undefined;
    binds["modelValue"] = currentValue.value ?? null;
    binds["onUpdate:modelValue"] = (v: any) =>
      $fcDynamicForm?.setFieldValue?.(name.value, v);
    if (!("invalid" in (props.rest || {}))) {
      binds["invalid"] = !!props.formApi?.getFieldState?.(name.value)?.invalid;
    }
  }

  return binds
})

</script>