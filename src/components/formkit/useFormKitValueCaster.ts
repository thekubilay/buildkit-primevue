const useFormKitValueCaster = () => {
  const cast = (value: any): any => {
    // handle null/undefined cases
    if (value === "null" || value === "undefined" || value === null || value === undefined) {
      return null;
    }

    // handle boolean strings
    if (value === "true" || value === "True") return true;
    if (value === "false" || value === "False") return false;

    // handle numeric strings
    if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
      // Convert to number if it's a valid numeric string
      // return Number(value);
      return value
    }

    // datetime strings (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss.sssZ)
    if (typeof value === "string" &&
      (/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(value))) {
      return new Date(value);
    }

    // check is isodatestring
    // if (typeof value === "string" && !isNaN(Date.parse(value))) {
    //   return new Date(value);
    // }

    // return the original value if no casting rules match
    return value;
  };

  return {
    cast
  };
};

export default useFormKitValueCaster;