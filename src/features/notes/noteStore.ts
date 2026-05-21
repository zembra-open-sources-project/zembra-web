import { create } from "zustand";
import { notesClient, taxonomyClient } from "../../api/client";
import type {
  CreateNoteInput,
  FieldDto,
  NoteDto,
  TagDto,
  UpdateNoteInput,
} from "../../api/types";

interface NotesState {
  /** Recent notes currently visible in the home feed. */
  notes: NoteDto[];
  /** Fields available for note organization. */
  fields: FieldDto[];
  /** Tags available for note organization. */
  tags: TagDto[];
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
  /** Creates a note and places it at the top of the recent feed. */
  createNote: (input: CreateNoteInput) => Promise<void>;
  /** Updates a note and moves it to the top of the recent feed. */
  updateNote: (noteRef: string, input: UpdateNoteInput) => Promise<void>;
  /** Deletes a note and removes it from the recent feed. */
  deleteNote: (noteRef: string) => Promise<void>;
  /** Loads fields from the active taxonomy client. */
  loadFields: () => Promise<void>;
  /** Loads tags from the active taxonomy client. */
  loadTags: () => Promise<void>;
}

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  fields: [],
  tags: [],
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
  createNote: async (input) => {
    const note = await notesClient.createNote(input);
    set((state) => ({
      notes: [note, ...state.notes.filter((item) => item.id !== note.id)].slice(
        0,
        50,
      ),
    }));

    const [fields, tags] = await Promise.all([
      taxonomyClient.listFields(),
      taxonomyClient.listTags(),
    ]);
    set({ fields, tags });
  },
  updateNote: async (noteRef, input) => {
    const note = await notesClient.updateNote(noteRef, input);
    set((state) => ({
      notes: [note, ...state.notes.filter((item) => item.id !== note.id)].slice(
        0,
        50,
      ),
    }));

    const [fields, tags] = await Promise.all([
      taxonomyClient.listFields(),
      taxonomyClient.listTags(),
    ]);
    set({ fields, tags });
  },
  deleteNote: async (noteRef) => {
    await notesClient.deleteNote(noteRef);
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteRef),
    }));
  },
  loadFields: async () => {
    const existingFields = get().fields;

    if (existingFields.length > 0) {
      return;
    }

    const fields = await taxonomyClient.listFields();
    set({ fields });
  },
  loadTags: async () => {
    const existingTags = get().tags;

    if (existingTags.length > 0) {
      return;
    }

    const tags = await taxonomyClient.listTags();
    set({ tags });
  },
}));
