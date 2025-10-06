export function setDynamicFields(columns: any[]): any {
  const object: any = {};

  columns.forEach((column) => {
    const cfg = column.extra_data[column.key] || {};

    // Clone to avoid mutating the original config
    const fieldCfg: any = {...cfg};

    // Do not force defaultValue for hidden-by-default fields.
    // Respect visibility controls (hideWhen/showWhen) when preparing dynamic fields.

    // const hideWhen = fieldCfg.hideWhen;
    // const showWhen = fieldCfg.showWhen;

    // Attach schema from rules for non-checkboxes
    const rules = fieldCfg?.schema || null;

    if (fieldCfg?.as !== "Checkbox" && rules) {
      fieldCfg.schema = rules;
    }

    // Ensure we don't prefill values for fields that are hidden initially based on static equals/includes
    // Initial visibility cannot observe runtime values here, so only clear eager defaultValue if hideWhen has static equals/includes vs known falsy triggers.
    // const shouldOmitDefault = (() => {
    //   try {
    //     // If hideWhen exists and equals/includes is defined as a value that is commonly true on initial state
    //     if (hideWhen && ("equals" in hideWhen || "includes" in hideWhen)) {
    //       // When the controlling field is usually initialized to false/''/undefined,
    //       // we cannot conclusively hide here. So skip.
    //       return false;
    //     }
    //     return false;
    //   } catch { return false; }
    // })();
    //
    // if (shouldOmitDefault) {
    //   delete fieldCfg.defaultValue;
    // }

    object[column.key] = fieldCfg;
  })

  return object
}

