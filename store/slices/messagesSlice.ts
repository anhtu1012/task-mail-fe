import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";

// Interface for message item
export interface MessageItem {
  code: string;
  messages: string[];
}

// Interface for the state
interface MessagesState {
  items: MessageItem[];
}

// Initial state
const initialState: MessagesState = {
  items: [],
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    // Add a new message item
    addMessage: (state, action: PayloadAction<MessageItem>) => {
      state.items.push(action.payload);
    },
    // Add multiple message items at once
    addMessages: (state, action: PayloadAction<MessageItem[]>) => {
      state.items = [...state.items, ...action.payload];
    },
    // Remove a message by code
    removeMessage: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.code !== action.payload);
    },
    // Update messages for a specific code
    updateMessage: (state, action: PayloadAction<MessageItem>) => {
      const index = state.items.findIndex(
        (item) => item.code === action.payload.code,
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    // Clear all messages
    clearMessages: (state) => {
      state.items = [];
    },
  },
});

export const {
  addMessage,
  addMessages,
  removeMessage,
  updateMessage,
  clearMessages,
} = messagesSlice.actions;

export const selectAllMessages = (state: RootState) => state.messages.items;
export const selectMessageByCode = (state: RootState, code: string) =>
  state.messages.items.find((item) => item.code === code);

export default messagesSlice.reducer;
