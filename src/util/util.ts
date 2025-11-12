import type { SPFI } from "@pnp/sp";
import type { IAttachmentInfo } from '@pnp/sp/attachments';

export interface IAssignee {
  Id: number;
  Title: string;
  Email: string;
  LoginName: string;
}

export const loadCurrentUser = async (sp: SPFI): Promise<IAssignee> => {
  const user = await sp.web.currentUser();
  return {
    Id: user.Id,
    Title: user.Title ?? "",
    Email: user.Email ?? "",
    LoginName: user.LoginName ?? ""
  };
};

export const loadAssigneesFromGroup = async (groupName: string, sp: SPFI): Promise<IAssignee[]> => {
    const users = await sp.web.siteGroups.getByName(groupName).users();
    return users.map(u => ({
        Id: u.Id,
        Title: u.Title,
        Email: u.Email ?? "",
        LoginName: u.LoginName ?? ""
    }));

    // return assignees;
}

// export const claimCurrent = async (
//   form: DevExpress.ui.dxForm,
//   sp: SPFI,
//   currentUser?: IAssignee
// ): Promise<void> => {
//     const resolvedUser = currentUser ?? await loadCurrentUser(sp);

//     if ((form as any).updateData) {
//     //   (form as any).updateData({
//     //     // AssigneeId: resolvedUser.Id,
//     //     // SpecialistName: resolvedUser.Title,
//     //     // SpecialistEmail: resolvedUser.Email
//     //     Title: resolvedUser.Title,
//     //     Email: resolvedUser.Email
//     //   });
//         form.option("AssignmentGroup.SpecialistName", "editorOptions.value", resolvedUser.Title);
//         form.option("AssignmentGroup.SpecialistEmail", "editorOptions.value", resolvedUser.Email);
//     } else {
//       // Fallback if method unavailable
//       const fd = form.option("formData") || {};
//     //   fd.AssigneeId = resolvedUser.Id;
//       fd.SpecialistName = resolvedUser.Title;
//       fd.SpecialistEmail = resolvedUser.Email;
//       form.option("formData", fd);
//     }
// }

export const getUserGroupIfExists = async (sp: SPFI, TARGET_GROUP_TITLES: any[]): Promise<string | null> => {
    // Get all site groups the current user belongs to
    const userGroups = await sp.web.currentUser.groups.select("Id", "Title")();

    // Find if the user is in one of the target groups
    const match = userGroups.find(g =>
      TARGET_GROUP_TITLES.some(t => g.Title.toLowerCase() === t.toLowerCase())
    );

    // Return the matching group name or null
    return match ? match.Title : null;
  }

  export const isUserInManagersGroup = async (sp: SPFI, Manager_GROUP_TITLES: any[]): Promise<boolean> => {
    // current user’s site groups
    const groups = await sp.web.currentUser.groups();
    if (!groups?.length) return false;

    // fallback: check by Title (case-insensitive)
    const titleSet = new Set(Manager_GROUP_TITLES.map(t => t.toLowerCase()));
    return groups.some(g => titleSet.has(g.Title?.toLowerCase()));
  }

  export const loadMccItems = async (sp: SPFI, TARGET_GROUP_TITLES: any[]): Promise<any[]> => {
    const me = await sp.web.currentUser();       // has Id/Title/Email
    const myId = (me as any).Id ?? (me as any).ID;

      // const inAny = await this.isUserInAnyTargetGroup(sp);
      const userGroup = await getUserGroupIfExists(sp, TARGET_GROUP_TITLES);

    const list = sp.web.lists.getByTitle("MCC_Requests").items;

    if (userGroup) {
      // Member of one of the groups → load the related items
      return await list
        .filter(i => i.text('Section').equals(userGroup).or().number('AuthorId').equals(myId))();
    } else {
      // Not a member → only items I created (AuthorId == myId)
      return await list
        .filter(i => i.number('AuthorId').equals(myId))();
    }
  }


  export const getAttachedFiles = async (sp: SPFI, Id: number): Promise<IAttachmentInfo[]> => {
    return sp.web.lists.getByTitle('MCC_Requests').items.getById(Id).attachmentFiles();
  }

  export const toLocalDateOnly = (spDate?: string): Date | undefined => {
      if (!spDate) return undefined;
      const d = new Date(spDate);
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
 }
  
    export const toSPDateOnly = (d?: Date): string | undefined =>{
        if (!d) return undefined;
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .split("T")[0]; // e.g. "2025-11-04"
    }
