// PeopleService.ts
// import { sp } from "./pnp-setup";

import { SPFI } from "@pnp/sp";

export interface IPeoplePickerUser {
  Key: string;
//   Id: number;
  DisplayText: string;
  EntityData?: {
    Email?: string;
    Department?: string;
    Title?: string;
  };
}

export async function searchPeople(term: string, sp:SPFI): Promise<IPeoplePickerUser[]> {
  if (!term || term.length < 2) return [];

  const res = await sp.profiles.clientPeoplePickerSearchUser({
    AllowEmailAddresses: true,
    AllowMultipleEntities: false,
    AllUrlZones: false,
    MaximumEntitySuggestions: 20,
    PrincipalSource: 15, // All
    PrincipalType: 1, // User + DL + SecurityGroup (adjust if you want only users)
    QueryString: term,
  });

  // PnPjs already returns parsed JSON
  return res as IPeoplePickerUser[];
}
