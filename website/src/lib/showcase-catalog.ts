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
  /** From contracts/app.json. The starter has none. */
  consistency?: "strict" | "adapted";
  screens: DeviceShowcaseScreen[];
};

export type DeviceShowcaseCatalog = {
  apps: DeviceShowcaseApp[];
};

export const deviceShowcaseCatalog = catalog as DeviceShowcaseCatalog;
