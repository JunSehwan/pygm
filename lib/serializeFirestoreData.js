export function serializeFirestoreData(value) {
  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreData(item));
  }

  if (typeof value === "object") {
    if (
      typeof value.toMillis === "function" &&
      typeof value.toDate === "function"
    ) {
      return value.toMillis();
    }

    const result = {};

    Object.keys(value).forEach((key) => {
      result[key] = serializeFirestoreData(value[key]);
    });

    return result;
  }

  return value;
}