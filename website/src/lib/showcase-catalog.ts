import catalog from "@/generated/showcase.json";

export type DeviceShowcaseScreen = {
  id: string;
  label: string;
  webPath: string;
  title: string;
};

export type DeviceShowcaseApp = {
  slug: string;
  name: string;
  summary: string;
  mark: string;
  shotPrefix: string;
  screens: DeviceShowcaseScreen[];
};

export type DeviceShowcaseCatalog = {
  apps: DeviceShowcaseApp[];
};

export const deviceShowcaseCatalog = catalog as DeviceShowcaseCatalog;
