import { create } from "zustand";
import { notesClient } from "../../api/client";
import type { CreateNoteInput, NoteDto } from "../../api/types";

interface NotesState {
  /** Notes currently visible in the UI. */
  notes: NoteDto[];
  /** Search keyword entered by the user. */
  keyword: string;
  /** Tag selected by the user. */
  selectedTag?: string;
  /** Replaces the active search keyword. */
  setKeyword: (keyword: string) => void;
  /** Replaces the selected tag filter. */
  setSelectedTag: (tag?: string) => void;
  /** Loads notes from the active notes client. */
  loadNotes: () => Promise<void>;
  /** Creates a note and refreshes the visible list. */
  createNote: (input: CreateNoteInput) => Promise<void>;
}

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  keyword: "",
  selectedTag: undefined,
  setKeyword: (keyword) => set({ keyword }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  loadNotes: async () => {
    const { keyword, selectedTag } = get();
    const notes = await notesClient.listNotes({ keyword, tag: selectedTag });
    set({ notes });
  },
  createNote: async (input) => {
    await notesClient.createNote(input);
    await get().loadNotes();
  },
}));
