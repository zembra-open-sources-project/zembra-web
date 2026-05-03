import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

/** Verifies that the initial note workspace renders. */
test("renders the card note workspace", async () => {
  render(<App />);

  expect(await screen.findByText("Zembra")).not.toBeNull();
});
