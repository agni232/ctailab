// @vitest-environment jsdom

import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CaesarWheel } from "@/activity-engine/cipher/components/CaesarWheel";
import { renderComponent } from "../helpers/react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function WheelHarness() {
  const [shift, setShift] = useState(0);

  return (
    <CaesarWheel
      alphabet={alphabet}
      shift={shift}
      minShift={0}
      maxShift={25}
      onShiftChange={setShift}
    />
  );
}

describe("CaesarWheel", () => {
  it("updates the visible mapping with touch-friendly buttons", async () => {
    const view = await renderComponent(<WheelHarness />);
    const increase = view.container.querySelector('[aria-label="Increase wheel shift"]');

    expect(view.container.querySelector(".wheel-readout")?.textContent).toContain("A→A");
    expect(view.container.querySelectorAll(".wheel-number")).toHaveLength(26);
    expect(view.container.querySelectorAll(".wheel-spoke")).toHaveLength(26);
    expect(view.container.querySelector(".wheel-number.is-highlighted")?.textContent).toBe("0");
    expect(increase).not.toBeNull();
    await view.click(increase!);
    expect(view.container.querySelector(".wheel-readout")?.textContent).toContain("A→B");
    expect(view.container.querySelector(".wheel-number.is-highlighted")?.textContent).toBe("1");
    await view.unmount();
  });

  it("supports arrow keys on the wheel slider", async () => {
    const view = await renderComponent(<WheelHarness />);
    const wheel = view.container.querySelector('[role="slider"]');

    expect(wheel).not.toBeNull();
    await view.keyDown(wheel!, "ArrowRight");
    expect(wheel?.getAttribute("aria-valuenow")).toBe("1");
    await view.keyDown(wheel!, "ArrowLeft");
    expect(wheel?.getAttribute("aria-valuenow")).toBe("0");
    await view.unmount();
  });
});
