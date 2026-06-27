import { create } from "zustand";
import { notesClient, taxonomyClient } from "../../api/client";
import type {
  CreateNoteInput,
  DailyNoteCount,
  FieldDto,
  NoteDto,
  TagDto,
  UpdateNoteInput,
} from "../../api/types";

interface NotesState {
  /** Recent notes currently visible in the home feed. */
  notes: NoteDto[];
  /** Recent notes loaded without a role filter for role navigation counts. */
  roleNavigationNotes: NoteDto[];
  /** Fields available for note organization. */
  fields: FieldDto[];
  /** Tags available for note organization. */
  tags: TagDto[];
  /** Daily note counts used by the home activity heatmap. */
  dailyNoteCounts: DailyNoteCount[];
  /** Cached notes loaded only for link previews. */
  notePreviewById: Record<string, NoteDto>;
  /** Search keyword entered by the user. */
  keyword: string;
  /** Tag selected by the user. */
  selectedTag?: string;
  /** Field selected by the user. */
  selectedField?: string;
  /** Role selected by the user. */
  selectedRole?: string;
  /** Replaces the active search keyword. */
  setKeyword: (keyword: string) => void;
  /** Replaces the selected tag filter. */
  setSelectedTag: (tag?: string) => void;
  /** Replaces the selected field filter. */
  setSelectedField: (field?: string) => void;
  /** Replaces the selected role filter and reloads recent notes. */
  setSelectedRole: (role?: string) => Promise<void>;
  /** Loads recent notes from the home feed endpoint. */
  loadRecentNotes: () => Promise<void>;
  /** Loads visible note counts for the past 30 days. */
  loadDailyNoteCounts: () => Promise<void>;
  /** Creates a note and places it at the top of the recent feed. */
  createNote: (input: CreateNoteInput) => Promise<void>;
  /** Updates a note and moves it to the top of the recent feed. */
  updateNote: (noteRef: string, input: UpdateNoteInput) => Promise<void>;
  /** Deletes a note and removes it from the recent feed. */
  deleteNote: (noteRef: string) => Promise<void>;
  /** Deletes an unused field and refreshes field navigation state. */
  deleteField: (fieldId: string) => Promise<void>;
  /** Loads a note for link preview without changing the recent feed. */
  loadNotePreview: (noteRef: string) => Promise<NoteDto>;
  /** Loads fields from the active taxonomy client. */
  loadFields: () => Promise<void>;
  /** Loads tags from the active taxonomy client. */
  loadTags: () => Promise<void>;
}

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  roleNavigationNotes: [],
  fields: [],
  tags: [],
  dailyNoteCounts: [],
  notePreviewById: {},
  keyword: "",
  selectedTag: undefined,
  selectedField: undefined,
  selectedRole: undefined,
  setKeyword: (keyword) => set({ keyword }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setSelectedRole: async (selectedRole) => {
    set({ selectedRole });
    const notes = await notesClient.listRecentNotes({
      limit: 50,
      role: selectedRole,
    });
    set((state) => ({
      notes,
      roleNavigationNotes:
        selectedRole === undefined || state.roleNavigationNotes.length === 0
          ? notes
          : state.roleNavigationNotes,
    }));
  },
  loadRecentNotes: async () => {
    const selectedRole = get().selectedRole;
    const notes = await notesClient.listRecentNotes({
      limit: 50,
      role: selectedRole,
    });
    set((state) => ({
      notes,
      roleNavigationNotes:
        selectedRole === undefined || state.roleNavigationNotes.length === 0
          ? notes
          : state.roleNavigationNotes,
    }));
  },
  loadDailyNoteCounts: async () => {
    const dailyNoteCounts = await notesClient.listDailyNoteCounts();
    set({ dailyNoteCounts });
  },
  createNote: async (input) => {
    const note = await notesClient.createNote(input);
    set((state) => ({
      notes:
        state.selectedRole === undefined || state.selectedRole === note.role
          ? [note, ...state.notes.filter((item) => item.id !== note.id)].slice(
              0,
              50,
            )
          : state.notes,
      roleNavigationNotes: [
        note,
        ...state.roleNavigationNotes.filter((item) => item.id !== note.id),
      ].slice(0, 50),
    }));

    const [fields, tags, dailyNoteCounts] = await Promise.all([
      taxonomyClient.listFields(),
      taxonomyClient.listTags(),
      notesClient.listDailyNoteCounts(),
    ]);
    set({ dailyNoteCounts, fields, tags });
  },
  updateNote: async (noteRef, input) => {
    const note = await notesClient.updateNote(noteRef, input);
    set((state) => ({
      notes:
        state.selectedRole === undefined || state.selectedRole === note.role
          ? [note, ...state.notes.filter((item) => item.id !== note.id)].slice(
              0,
              50,
            )
          : state.notes.filter((item) => item.id !== note.id),
      roleNavigationNotes: [
        note,
        ...state.roleNavigationNotes.filter((item) => item.id !== note.id),
      ].slice(0, 50),
    }));

    const [fields, tags, dailyNoteCounts] = await Promise.all([
      taxonomyClient.listFields(),
      taxonomyClient.listTags(),
      notesClient.listDailyNoteCounts(),
    ]);
    set({ dailyNoteCounts, fields, tags });
  },
  deleteNote: async (noteRef) => {
    await notesClient.deleteNote(noteRef);
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteRef),
      roleNavigationNotes: state.roleNavigationNotes.filter(
        (note) => note.id !== noteRef,
      ),
    }));
  },
  deleteField: async (fieldId) => {
    await taxonomyClient.deleteField(fieldId);
    const fields = await taxonomyClient.listFields();

    set((state) => ({
      fields,
      selectedField:
        state.selectedField === fieldId ? undefined : state.selectedField,
    }));
  },
  loadNotePreview: async (noteRef) => {
    const state = get();
    const feedNote = state.notes.find((note) => note.id === noteRef);

    if (feedNote) {
      return feedNote;
    }

    const cachedNote = state.notePreviewById[noteRef];

    if (cachedNote) {
      return cachedNote;
    }

    const note = await notesClient.getNote(noteRef);
    set((current) => ({
      notePreviewById: {
        ...current.notePreviewById,
        [note.id]: note,
      },
    }));
    return note;
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
