import type {Demo} from './types'

import {separatorDemo} from './separator'
import {textInputsDemo} from './textInputs'
import {selectionDemo} from './selection'
import {numbersDatesDemo} from './numbersDates'
import {validationDemo} from './validation'
import {visibilityDemo} from './visibility'
import {layoutDemo} from './layout'
import {specialDemo} from './special'
import {dynamicFieldsDemo} from './dynamicFields'
import {kitchenSinkDemo} from './kitchenSink'

export const demos: Demo[] = [
  separatorDemo,
  textInputsDemo,
  selectionDemo,
  numbersDatesDemo,
  validationDemo,
  visibilityDemo,
  layoutDemo,
  specialDemo,
  dynamicFieldsDemo,
  kitchenSinkDemo,
]

export const findDemo = (id: string | undefined): Demo =>
  demos.find(d => d.id === id) ?? demos[0]

export type {Demo}
