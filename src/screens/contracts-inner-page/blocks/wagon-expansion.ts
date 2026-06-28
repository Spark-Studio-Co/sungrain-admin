export const getWagonExpansionId = (wagon: any) =>
  String(
    wagon?.id ??
      wagon?.wagon_id ??
      wagon?.wagon?.id ??
      wagon?.number ??
      ""
  );
