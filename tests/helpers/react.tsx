import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface RenderedComponent {
  container: HTMLDivElement;
  click: (element: Element) => Promise<void>;
  clickAll: (elements: Element[]) => Promise<void>;
  input: (element: HTMLInputElement | HTMLTextAreaElement, value: string) => Promise<void>;
  keyDown: (element: Element, key: string) => Promise<void>;
  unmount: () => Promise<void>;
}

export async function renderComponent(node: ReactNode): Promise<RenderedComponent> {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);

  await act(async () => {
    root.render(node);
  });

  return {
    container,
    async click(element) {
      await act(async () => {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    },
    async clickAll(elements) {
      // One act() for the whole group, so React batches them into a single render.
      await act(async () => {
        for (const element of elements) {
          element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
    },
    async input(element, value) {
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      await act(async () => {
        setter?.call(element, value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    },
    async keyDown(element, key) {
      await act(async () => {
        element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  };
}

export function getButton(container: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button, a")).find(
    (element) => element.textContent?.replace(/\s+/g, " ").trim() === label
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`);
  }

  return button;
}
