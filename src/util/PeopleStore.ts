import { SPFI } from "@pnp/sp";
import { searchPeople, IPeoplePickerUser } from "./PeopleService";

export interface IRecipientOption {
  id: string;
  name: string;
  email?: string;
}

export const createPeopleStore = (sp: SPFI) =>
  new DevExpress.data.CustomStore<IRecipientOption, string>({
    key: "id",
    // DevExtreme will call this on typing / search
    load: async (loadOptions: any): Promise<IRecipientOption[]> => {
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