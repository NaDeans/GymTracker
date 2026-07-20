import { createContext, useCallback, useContext } from "react";

// Lets any TextInput deep in the tree ask its nearest scrollable ancestor
// (a ScrollView or FlatList) to scroll itself into view above the keyboard
// on focus. This is the piece RN doesn't provide out of the box: iOS gets
// most of the way there via `automaticallyAdjustKeyboardInsets`, but Android
// has no equivalent, and neither platform auto-scrolls when the focused
// field is inside content taller than the currently-visible area (e.g. a
// modal form, or a field far down a long list).
//
// Usage: wrap a scroll container's screen/region in <KeyboardScrollProvider
// scrollRef={ref}>, attach the same `ref` to the ScrollView/FlatList, then
// call `useKeyboardScroll()` from TextField/Stepper and invoke it from
// onFocus. Safe to use with no provider present (no-ops).
const KeyboardScrollContext = createContext(null);

export function KeyboardScrollProvider({ scrollRef, extraOffset = 24, children }) {
  const scrollToInput = useCallback(
    (event) => {
      const nodeHandle = event?.nativeEvent?.target;
      const responder = scrollRef?.current?.getScrollResponder?.();
      if (nodeHandle == null || !responder?.scrollResponderScrollNativeHandleToKeyboard) return;
      responder.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, extraOffset, true);
    },
    [scrollRef, extraOffset]
  );

  return (
    <KeyboardScrollContext.Provider value={scrollToInput}>
      {children}
    </KeyboardScrollContext.Provider>
  );
}

// Returns a `(focusEvent) => void` callback, or undefined if no provider is
// present above in the tree. Always safe to call optionally: `scrollToInput?.(e)`.
export function useKeyboardScroll() {
  return useContext(KeyboardScrollContext);
}
