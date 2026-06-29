type ApplicationLike = {
  id?: string | number | null;
  wagons?: any[] | null;
};

const normalizeId = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
};

const getWagonApplicationId = (wagon: any) =>
  wagon?.applicationId ??
  wagon?.application_id ??
  wagon?.application?.id ??
  wagon?.wagon?.applicationId ??
  wagon?.wagon?.application_id ??
  wagon?.wagon?.application?.id;

export const getApplicationScopedWagons = (application: ApplicationLike) => {
  const applicationId = normalizeId(application?.id);
  const wagons = Array.isArray(application?.wagons) ? application.wagons : [];

  if (!applicationId) {
    return wagons;
  }

  return wagons.filter((wagon) => {
    return normalizeId(getWagonApplicationId(wagon)) === applicationId;
  });
};
