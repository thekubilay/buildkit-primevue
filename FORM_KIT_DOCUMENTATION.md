# BuildKit PrimeVue - Documentation

PrimeVue v4 ve Tailwind CSS uzerine kurulmus Vue 3 form component kutuphanesidir. Tek bir `<FormKit>` componenti ile tipli, validasyonlu formlar olusturmanizi saglar.

## Kurulum

```bash
npm install buildkit-primevue
```

```ts
// main.ts
import { BuildKitPrimeVue } from 'buildkit-primevue'

app.use(BuildKitPrimeVue)
```

---

## Temel Kullanim

```vue
<script setup lang="ts">
import FormKit, { setFields, getPayload } from 'buildkit-primevue'
import type { FormKitProps } from 'buildkit-primevue'
import { reactive, ref } from 'vue'

const form = ref<Record<string, any>>({})

const fields: FormKitProps['fields'] = {
  name: {
    label: 'Ad Soyad',
    defaultValue: '',
    placeholder: 'Adinizi girin',
    schema: 'required|max:50',
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    style: {},
    vertical: false
  }
}

const args = reactive<FormKitProps>({ fields, size: 'small' })

function onSubmit({ valid, states }: any) {
  if (valid) {
    const payload = getPayload(states, fields)
    console.log(payload)
  }
}
</script>

<template>
  <FormKit v-model="form" v-bind="args" @submit="onSubmit">
    <template #footer>
      <button type="submit">Gonder</button>
    </template>
  </FormKit>
</template>
```

---

## FormKit Component Props

| Prop | Tip | Zorunlu | Aciklama |
|------|-----|---------|----------|
| `fields` | `{ [key: string]: FormKitField }` | Evet | Form alan tanimlari |
| `size` | `"small" \| "medium" \| "large"` | Hayir | PrimeVue component boyutu (varsayilan: `"medium"`) |
| `modelValue` | `Record<string, any>` | Hayir | `v-model` ile form API erisimi |

### Slotlar

| Slot | Aciklama |
|------|----------|
| `start` | Formun en basina icerik ekler |
| `default` | Tum alanlari override eder (`$form` API'sine erisim saglar) |
| `end` | Alanlardan sonra, footer'dan once icerik ekler |
| `footer` | Form alt kismi (genellikle submit butonu icin) |

---

## FormKitField Arayuzu

Her bir form alani asagidaki parametrelerle tanimlanir:

```ts
interface FormKitField {
  // --- Temel Parametreler ---
  as?: string                // PrimeVue component tipi (varsayilan: "InputText")
  label?: string             // Alan etiketi
  defaultValue?: any         // Baslangic degeri
  required?: boolean         // Zorunlu alan isareti
  inputId?: string           // HTML id attribute (label baglantisi icin)

  // --- Validasyon ---
  schema?: string            // Validasyon kurallari (orn: "required|email|max:100")

  // --- Gorunum ---
  colSpan: { mobile: number; tablet: number; desktop: number }  // Responsive genislik
  style: any                 // Inline stiller
  className?: string         // CSS sinif adi
  vertical: boolean          // Grup inputlar icin dikey yerlestirme

  // --- Secenekler ---
  options?: Array<{ label: string; value: any }>  // Select, RadioButton, CheckboxGroup icin

  // --- Kosullu Gorunurluk ---
  showWhen?: { field: string; equals?: any; includes?: any | any[] }
  hideWhen?: { field: string; equals?: any; includes?: any | any[] }

  // --- Ek Parametreler ---
  groupId?: string           // Grup tanimlayici
  messages?: string[]        // Ozel mesajlar
  help?: string              // Yardim metni (alanin altinda gosterilir)
  iconLeft?: string          // Sol ikon sinifi (orn: "fa-regular fa-user")
  iconRight?: string         // Sag ikon sinifi (orn: "fa-regular fa-eye")
  buttonType?: boolean       // RadioButton'lari buton stilinde gosterir
  buttonTypeClass?: string   // Buton tipi icin ek CSS sinifi
  optionLabel?: string       // Option nesnelerinde label key'i
  optionValue?: string       // Option nesnelerinde value key'i
  placeholder?: string       // Placeholder metni
  disabled?: boolean         // Alani devre disi birakir
  readonly?: boolean         // Salt okunur yapar

  [key: string]: any         // Diger PrimeVue component prop'lari dogrudan gecilir
}
```

---

## Desteklenen Component Tipleri (`as`)

### Metin Girisleri

| `as` Degeri | Aciklama | Ornek |
|-------------|----------|-------|
| `InputText` | Tek satirlik metin (varsayilan) | Ad, email, telefon |
| `Textarea` | Cok satirlik metin | Aciklama, not |
| `Password` | Sifre girisi | Sifre alanlari |
| `Editor` | Zengin metin editoru (Quill) | HTML icerik |

```ts
// InputText (varsayilan - as belirtmeye gerek yok)
name: {
  label: 'Ad',
  defaultValue: '',
  placeholder: 'Adinizi girin',
  schema: 'required|max:50',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}

// Textarea
description: {
  label: 'Aciklama',
  as: 'Textarea',
  defaultValue: '',
  rows: 5,
  schema: 'max:500',
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}

// Password
password: {
  label: 'Sifre',
  as: 'Password',
  defaultValue: '',
  toggleMask: true,
  feedback: false,
  schema: 'required|min:8',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}
```

### Sayi ve Tarih

| `as` Degeri | Aciklama | Ornek |
|-------------|----------|-------|
| `InputNumber` | Sayisal giris | Fiyat, miktar |
| `DatePicker` | Tarih secici | Dogum tarihi |
| `Calendar` | Tarih secici (alternatif) | Baslangic/bitis tarihi |

```ts
// InputNumber
price: {
  label: 'Fiyat',
  as: 'InputNumber',
  defaultValue: 0,
  mode: 'currency',
  currency: 'TRY',
  schema: 'required',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}

// DatePicker
birthdate: {
  label: 'Dogum Tarihi',
  as: 'DatePicker',
  defaultValue: null,
  dateFormat: 'yy-mm-dd',
  schema: 'required',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}
```

### Secim Alanlari

| `as` Degeri | Aciklama | Ornek |
|-------------|----------|-------|
| `Select` | Tekli secim dropdown | Ulke, kategori |
| `MultiSelect` | Coklu secim dropdown | Etiketler, yetenekler |
| `RadioButton` | Radio buton grubu | Cinsiyet, tip |
| `CheckboxGroup` | Checkbox grubu | Ozellikler, tercihler |
| `Checkbox` | Tekli checkbox | Onay kutusu |

```ts
// Select
country: {
  label: 'Ulke',
  as: 'Select',
  defaultValue: null,
  placeholder: 'Ulke secin',
  schema: 'required',
  options: [
    { label: 'Turkiye', value: 'TR' },
    { label: 'Japonya', value: 'JP' },
    { label: 'Almanya', value: 'DE' }
  ],
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}

// MultiSelect
skills: {
  label: 'Yetenekler',
  as: 'MultiSelect',
  defaultValue: [],
  placeholder: 'Yetenek secin',
  options: [
    { label: 'Vue.js', value: 'vue' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' }
  ],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}

// RadioButton
gender: {
  label: 'Cinsiyet',
  as: 'RadioButton',
  defaultValue: null,
  schema: 'required',
  options: [
    { label: 'Erkek', value: 'male' },
    { label: 'Kadin', value: 'female' }
  ],
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}

// RadioButton (buton stili)
plan: {
  label: 'Plan',
  as: 'RadioButton',
  buttonType: true,
  defaultValue: 'basic',
  options: [
    { label: 'Basic', value: 'basic' },
    { label: 'Pro', value: 'pro' },
    { label: 'Enterprise', value: 'enterprise' }
  ],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}

// CheckboxGroup
features: {
  label: 'Ozellikler',
  as: 'CheckboxGroup',
  defaultValue: [],
  vertical: true,
  options: [
    { label: 'Bildirimler', value: 'notifications' },
    { label: 'Karanlik Mod', value: 'dark_mode' },
    { label: 'Otomasyon', value: 'automation' }
  ],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {}
}

// Checkbox (tekli)
terms: {
  label: 'Kosullari kabul ediyorum',
  as: 'Checkbox',
  defaultValue: false,
  schema: 'required',
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}
```

### Toggle ve Switch

| `as` Degeri | Aciklama | Ornek |
|-------------|----------|-------|
| `ToggleButton` | Toggle buton | Acik/Kapali |
| `InputSwitch` | Switch | Aktif/Pasif |

```ts
// InputSwitch
isActive: {
  label: 'Aktif',
  as: 'InputSwitch',
  defaultValue: false,
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  style: {},
  vertical: false
}
```

### Ozel Tipler

| `as` Degeri | Aciklama | Ornek |
|-------------|----------|-------|
| `Chips` | Etiket/tag girisi | Anahtar kelimeler |
| `Zipcode` | Posta kodu arama (Japonya) | Adres otomatik doldurma |

```ts
// Chips
tags: {
  label: 'Etiketler',
  as: 'Chips',
  defaultValue: [],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}
```

---

## Validasyon Kurallari (`schema`)

Validasyon kurallari pipe (`|`) ile ayrilarak `schema` parametresinde tanimlanir.

| Kural | Parametre | Aciklama | Ornek |
|-------|-----------|----------|-------|
| `required` | - | Zorunlu alan | `"required"` |
| `email` | - | Gecerli email formati | `"email"` |
| `min` | `:N` | Minimum karakter/deger | `"min:3"` |
| `max` | `:N` | Maksimum karakter/deger | `"max:100"` |
| `length` | `:N` | Tam karakter sayisi | `"length:11"` |
| `between` | `:MIN,MAX` | Karakter araligi | `"between:5,20"` |
| `number` | - | Sadece rakam | `"number"` |
| `url` | - | Gecerli URL formati | `"url"` |
| `katakana` | - | Sadece Katakana | `"katakana"` |
| `hiragana` | - | Sadece Hiragana | `"hiragana"` |
| `romaji` | - | Sadece latin harf, rakam, `_`, `-` | `"romaji"` |
| `nospace` | - | Bosluk icermez | `"nospace"` |
| `regex` | `:PATTERN` | Ozel regex deseni | `"regex:^[A-Z]{2}\\d{4}$"` |

### Birlesik Kullanim Ornekleri

```ts
// Email alani
schema: "required|email|max:100"

// Telefon numarasi
schema: "required|number|length:11"

// Kullanici adi
schema: "required|romaji|min:3|max:20|nospace"

// Sifre
schema: "required|min:8|max:128"

// Opsiyonel URL
schema: "url"

// Ozel format (orn: TR-1234)
schema: "required|regex:^TR-\\d{4}$"
```

---

## Responsive Grid Sistemi (`colSpan`)

`colSpan` parametresi her alan icin responsive genislik belirler. Deger, satirdaki kolon sayisini temsil eder.

```ts
colSpan: { mobile: number, tablet: number, desktop: number }
```

### Breakpoint'ler

| Cihaz | Ekran Genisligi | Ornek |
|-------|-----------------|-------|
| `mobile` | < 512px | Telefon |
| `tablet` | 512px - 724px | Tablet |
| `desktop` | > 724px | Masaustu |

### Kolon Genislikleri

| Deger | Genislik |
|-------|----------|
| `1` | `100%` (tam genislik) |
| `2` | `calc(50% - 10px)` (yari genislik) |
| `3` | `calc(33.33% - 13.33px)` (ucte bir) |
| `4` | `calc(25% - 15px)` (dortte bir) |
| `5` | `calc(20% - 16px)` (beste bir) |
| `6` | `calc(16.67% - 12.67px)` (altida bir) |

### Ornekler

```ts
// Mobilde tam genislik, tablette yari, masaustunde ucte bir
colSpan: { mobile: 1, tablet: 2, desktop: 3 }

// Her yerde tam genislik
colSpan: { mobile: 1, tablet: 1, desktop: 1 }

// Mobilde tam, tablette ve masaustunde yari
colSpan: { mobile: 1, tablet: 2, desktop: 2 }
```

---

## Kosullu Gorunurluk (`showWhen` / `hideWhen`)

Alanlari baska bir alanin degerine gore gosterip gizleyebilirsiniz. Gizlenen alanlar validasyondan da muaf tutulur.

### `showWhen` - Alan goster

```ts
// "type" alani "email" ise goster
email: {
  label: 'Email',
  schema: 'required|email',
  showWhen: { field: 'type', equals: 'email' },
  // ...
}

// "category" alani "electronics" icerigini iceriyorsa goster
warranty: {
  label: 'Garanti',
  showWhen: { field: 'category', includes: 'electronics' },
  // ...
}

// "role" alani "admin" veya "editor" ise goster
permissions: {
  label: 'Yetkiler',
  showWhen: { field: 'role', includes: ['admin', 'editor'] },
  // ...
}
```

### `hideWhen` - Alan gizle

```ts
// "status" alani "archived" ise gizle
editButton: {
  label: 'Duzenle',
  hideWhen: { field: 'status', equals: 'archived' },
  // ...
}

// "type" alani "private" veya "internal" ise gizle
publicUrl: {
  label: 'Public URL',
  hideWhen: { field: 'type', includes: ['private', 'internal'] },
  // ...
}
```

### Karsilastirma Mantigi

- **`equals`**: Strict equality (tip donusumu ile). `"1"` ve `1`, `"true"` ve `true` eslesir.
- **`includes`**: Dizi ise eleman kontrolu, string ise icerik (substring) kontrolu yapar.

---

## Ikon Destegi (`iconLeft` / `iconRight`)

InputText ve benzeri alanlara sol/sag ikon ekleyebilirsiniz.

```ts
email: {
  label: 'Email',
  iconLeft: 'fa-regular fa-envelope',
  schema: 'required|email',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}

search: {
  label: 'Ara',
  iconRight: 'fa-regular fa-search',
  placeholder: 'Arama...',
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  style: {},
  vertical: false
}

password: {
  label: 'Sifre',
  as: 'Password',
  iconLeft: 'fa-regular fa-lock',
  iconRight: 'fa-regular fa-eye',
  schema: 'required|min:8',
  colSpan: { mobile: 1, tablet: 2, desktop: 2 },
  style: {},
  vertical: false
}
```

---

## Utility Fonksiyonlari

### `setFields(data, fields)`

API'den gelen veriyi field `defaultValue`'larina atar. Tip donusumu otomatik yapilir.

```ts
import { setFields } from 'buildkit-primevue'

// API'den gelen veri
const apiData = {
  name: 'Ahmet',
  age: '30',           // string gelir → InputNumber icin number'a donusur
  isActive: 'true',    // string gelir → Checkbox icin boolean'a donusur
  createdAt: '2024-01-15T10:30:00.000Z'  // ISO string → DatePicker icin Date'e donusur
}

setFields(apiData, fields)
// Artik her field'in defaultValue'su dogru tipte atanmistir
```

### `getPayload(states, fields)`

Form state'inden temiz bir payload cikarir. Tip donusumu otomatik yapilir.

```ts
import { getPayload } from 'buildkit-primevue'

function onSubmit({ valid, states }) {
  if (valid) {
    const payload = getPayload(states, fields)
    // payload: { name: "Ahmet", age: 30, isActive: true, createdAt: "2024-01-15T10:30:00.000Z" }
    await api.post('/users', payload)
  }
}
```

### `clear(data, fields)`

Form alanlarini tipine gore akilli bir sekilde temizler.

```ts
import { clear } from 'buildkit-primevue'

// form ref'ini ve field tanimlarini vererek temizle
clear(form.value, fields)
```

### `setDynamicFields(columns)`

Backend'den gelen kolon konfigurasyonlarini field nesnesine donusturur.

```ts
import { setDynamicFields } from 'buildkit-primevue'

const columns = [/* API'den gelen kolon tanimlari */]
const fields = setDynamicFields(columns)
```

---

## Otomatik Tip Donusumu

Kutuphane, component tipine gore degerleri otomatik olarak donusturur:

| Component | Giris | Cikis |
|-----------|-------|-------|
| `InputNumber`, `Slider` | `"42"` | `42` (number) |
| `Checkbox`, `ToggleButton`, `InputSwitch` | `"true"` | `true` (boolean) |
| `Calendar`, `DatePicker` | `"2024-01-15T10:30:00Z"` | `Date` nesnesi |
| `MultiSelect` | `"vue,react,angular"` | `["vue", "react", "angular"]` (array) |
| `InputText`, `Textarea`, vb. | `"metin"` | `"metin"` (string) |

ISO-8601 formatindaki tarih string'leri (orn: `2024-01-15T10:30:00.000Z`) otomatik olarak `Date` nesnesine donusturulur.

---

## Tam Form Ornegi

```ts
import { reactive } from 'vue'
import type { FormKitProps } from 'buildkit-primevue'

const fields: FormKitProps['fields'] = {
  // --- Kisisel Bilgiler ---
  firstName: {
    label: 'Ad',
    defaultValue: '',
    placeholder: 'Adiniz',
    schema: 'required|max:50',
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    style: {},
    vertical: false
  },
  lastName: {
    label: 'Soyad',
    defaultValue: '',
    placeholder: 'Soyadiniz',
    schema: 'required|max:50',
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    style: {},
    vertical: false
  },
  email: {
    label: 'Email',
    defaultValue: '',
    iconLeft: 'fa-regular fa-envelope',
    placeholder: 'ornek@email.com',
    schema: 'required|email|max:100',
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    style: {},
    vertical: false
  },

  // --- Iletisim Tercihi ---
  contactType: {
    label: 'Iletisim Yontemi',
    as: 'RadioButton',
    buttonType: true,
    defaultValue: 'email',
    schema: 'required',
    options: [
      { label: 'Email', value: 'email' },
      { label: 'Telefon', value: 'phone' },
      { label: 'Posta', value: 'mail' }
    ],
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    style: {},
    vertical: false
  },

  // --- Kosullu Alanlar ---
  phone: {
    label: 'Telefon',
    defaultValue: '',
    placeholder: '05XX XXX XX XX',
    schema: 'required|number|length:11',
    showWhen: { field: 'contactType', equals: 'phone' },
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    style: {},
    vertical: false
  },
  address: {
    label: 'Posta Adresi',
    as: 'Textarea',
    defaultValue: '',
    rows: 3,
    schema: 'required|max:200',
    showWhen: { field: 'contactType', equals: 'mail' },
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    style: {},
    vertical: false
  },

  // --- Diger ---
  birthdate: {
    label: 'Dogum Tarihi',
    as: 'DatePicker',
    defaultValue: null,
    schema: 'required',
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    style: {},
    vertical: false
  },
  country: {
    label: 'Ulke',
    as: 'Select',
    defaultValue: null,
    placeholder: 'Ulke secin',
    schema: 'required',
    options: [
      { label: 'Turkiye', value: 'TR' },
      { label: 'Japonya', value: 'JP' }
    ],
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    style: {},
    vertical: false
  },
  skills: {
    label: 'Yetenekler',
    as: 'MultiSelect',
    defaultValue: [],
    placeholder: 'Yetenek secin',
    options: [
      { label: 'JavaScript', value: 'js' },
      { label: 'TypeScript', value: 'ts' },
      { label: 'Python', value: 'py' }
    ],
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    style: {},
    vertical: false
  },
  newsletter: {
    label: 'Bulten aboneligi',
    as: 'InputSwitch',
    defaultValue: false,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    style: {},
    vertical: false
  },
  terms: {
    label: 'Kullanim kosullarini kabul ediyorum',
    as: 'Checkbox',
    defaultValue: false,
    schema: 'required',
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    style: {},
    vertical: false
  }
}
```

---

## PrimeVue Prop Pass-Through

`FormKitField` arayuzundeki `[key: string]: any` sayesinde, PrimeVue componentlerine ait tum prop'lar dogrudan gecirilir. Ornegin:

```ts
// InputNumber'a ozel PrimeVue prop'lari
price: {
  as: 'InputNumber',
  mode: 'currency',        // PrimeVue InputNumber prop
  currency: 'TRY',         // PrimeVue InputNumber prop
  minFractionDigits: 2,    // PrimeVue InputNumber prop
  maxFractionDigits: 2,    // PrimeVue InputNumber prop
  // ...
}

// Select'e ozel PrimeVue prop'lari
category: {
  as: 'Select',
  filter: true,            // PrimeVue Select prop (arama ozelligi)
  showClear: true,         // PrimeVue Select prop
  optionLabel: 'name',     // PrimeVue Select prop (ozel label key)
  optionValue: 'id',       // PrimeVue Select prop (ozel value key)
  // ...
}

// Textarea'ya ozel PrimeVue prop'lari
notes: {
  as: 'Textarea',
  rows: 5,                 // PrimeVue Textarea prop
  autoResize: true,        // PrimeVue Textarea prop
  // ...
}
```

> **Not**: `defaultValue`, `schema`, `showWhen`, `hideWhen` ve `colSpan` parametreleri PrimeVue component'ine gecilmez; bunlar kutuphane tarafindan dahili olarak islenir.

---

## Notlar

- Validasyon hata mesajlari varsayilan olarak **Japonca** dilindedir.
- Gizlenen alanlar (`showWhen`/`hideWhen`) otomatik olarak validasyondan muaf tutulur.
- Form submit edildiginde, gizli alanlarin degerleri payload'a dahil edilmez.
- `setFields` ve `getPayload` fonksiyonlari component tipine (`as`) gore otomatik tip donusumu yapar.