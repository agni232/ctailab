// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { DiscoverCipher } from "@/activity-engine/cipher/components/DiscoverCipher";
import { renderComponent } from "../helpers/react";

const config = {
  title: "What is a secret message?",
  prompt: "A cipher changes a normal message into a secret one using a key.",
  normalMessage: "HELLO",
  shift: 3,
  keyExplanation: "The key tells us how many places to move each letter."
};

describe("DiscoverCipher", () => {
  it("uses one key for the example and the full alphabet map", async () => {
    const view = await renderComponent(
      <DiscoverCipher alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ" config={config} />
    );

    expect(view.container.textContent).toContain(config.prompt);
    expect(view.container.textContent).toContain(config.keyExplanation);
    expect(view.container.querySelectorAll(".alphabet-table button")).toHaveLength(26);
    expect(view.container.querySelector(".message-transformation > div:last-child strong")?.textContent).toBe("KHOOR");
    expect(view.container.querySelector(".alphabet-table tr:last-child td strong")?.textContent).toBe("D");

    const increaseKey = view.container.querySelector('[aria-label="Increase discovery key"]');
    expect(increaseKey).not.toBeNull();
    await view.click(increaseKey!);

    expect(view.container.querySelector(".message-transformation > div:last-child strong")?.textContent).toBe("LIPPS");
    expect(view.container.querySelector(".alphabet-table tr:last-child td strong")?.textContent).toBe("E");
    expect(view.container.querySelector(".discover-key-control output")?.textContent).toBe("4");
    await view.unmount();
  });

  it("explains selected mappings and alphabet wrap-around", async () => {
    const view = await renderComponent(
      <DiscoverCipher alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ" config={config} />
    );

    const fButton = view.container.querySelector('[aria-label="F becomes I"]');
    expect(fButton).not.toBeNull();
    await view.click(fButton!);
    expect(view.container.querySelector(".mapping-explanation")?.textContent).toBe("F moves 3 places to become I.");
    expect(view.container.querySelectorAll(".alphabet-table td.is-active")).toHaveLength(2);

    const zButton = view.container.querySelector('[aria-label="Z becomes C"]');
    expect(zButton).not.toBeNull();
    await view.click(zButton!);
    expect(view.container.querySelector(".mapping-explanation")?.textContent).toBe("Z moves 3 places and wraps back to C.");

    const increaseKey = view.container.querySelector('[aria-label="Increase discovery key"]');
    await view.click(increaseKey!);
    expect(view.container.querySelector(".mapping-explanation")?.textContent).toBe("Z moves 4 places and wraps back to D.");
    expect(view.container.textContent).toContain("EncodeTurn a normal message into a secret message.");
    expect(view.container.textContent).toContain("DecodeTurn a secret message back into the normal message.");
    await view.unmount();
  });
});
