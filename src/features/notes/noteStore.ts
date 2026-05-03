import { create } from "zustand";
import { notesClient, taxonomyClient } from "../../api/client";
import type { FieldDto, NoteDto } from "../../api/types";

interface NotesState {
  /** Recent notes currently visible in the home feed. */
  notes: NoteDto[];
  /** Fields available for note organization. */
  fields: FieldDto[];
  /** Search keyword entered by the user. */
  keyword: string;
  /** Tag selected by the user. */
  selectedTag?: string;
  /** Field selected by the user. */
  selectedField?: string;
  /** Replaces the active search keyword. */
  setKeyword: (keyword: string) => void;
  /** Replaces the selected tag filter. */
  setSelectedTag: (tag?: string) => void;
  /** Replaces the selected field filter. */
  setSelectedField: (field?: string) => void;
  /** Loads recent notes from the home feed endpoint. */
  loadRecentNotes: () => Promise<void>;
  /** Loads fields from the active taxonomy client. */
  loadFields: () => Promise<void>;
}

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  fields: [],
  keyword: "",
  selectedTag: undefined,
  selectedField: undefined,
  setKeyword: (keyword) => set({ keyword }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedField: (selectedField) => set({ selectedField }),
  loadRecentNotes: async () => {
    const notes = await notesClient.listRecentNotes({ limit: 50 });
    set({ notes });
  },
  loadFields: async () => {
    const existingFields = get().fields;

    if (existingFields.length > 0) {
      return;
    }

    const fields = await taxonomyClient.listFields();
    set({ fields });
  },
}));
