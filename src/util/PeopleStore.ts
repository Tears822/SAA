/// <reference path="../../node_modules/devextreme/bundles/dx.all.d.ts" />
import DevExpress from "devextreme/bundles/dx.all";
import { SPFI } from "@pnp/sp";
import { searchPeople, IPeoplePickerUser } from "./PeopleService";

export interface IRecipientOption {
  id: string;
  name: string;
  email?: string;
}

export const createPeopleStore = (sp: SPFI) : DevExpress.data.CustomStore<IRecipientOption, string> =>
  new DevExpress.data.CustomStore<IRecipientOption, string>({
    key: "id",
    // DevExtreme will call this on typing / search
    load: async (loadOptions: DevExpress.data.LoadOptions): Promise<IRecipientOption[]> => {
      const searchValue: string = loadOptions.searchValue || loadOptions.searchExpr || "";

      if (!searchValue || searchValue.length < 2) {
        return [];
      }

      const users: IPeoplePickerUser[] = await searchPeople(searchValue, sp);

      return users.map((u) => ({
        id: u.Key, // login / unique key
        name: u.DisplayText,
        email: u.EntityData?.Email,
      }));
    },
  });