// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { MessageEncoder } from "@/activity-engine/cipher/components/MessageEncoder";
import { getButton, renderComponent } from "../helpers/react";

describe("MessageEncoder", () => {
  it("encodes and decodes immediately with one shared key", async () => {
    const view = await renderComponent(
      <MessageEncoder
        activityId="test-activity"
        alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        minShift={0}
        maxShift={25}
        defaultShift={3}
        defaultText="HELLO"
        quickMessages={["HELLO"]}
        onActivityStart={vi.fn()}
      />
    );
    const textarea = view.container.querySelector("textarea");
    const result = view.container.querySelector(".equation-result strong");

    expect(result?.textContent).toBe("KHOOR");
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    await view.input(textarea as HTMLTextAreaElement, "KHOOR");
    await view.click(getButton(view.container, "Decode"));
    expect(result?.textContent).toBe("HELLO");
    await view.unmount();
  });
});
