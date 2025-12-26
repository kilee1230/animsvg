import type { Preview } from "@storybook/react";
import React from "react";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f9f9f9" },
        { name: "dark", value: "#09090b" },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      // Check both: story parameter default AND toolbar selection
      const storyBgDefault = context.parameters.backgrounds?.default;
      const globalBgValue = context.globals.backgrounds?.value;

      // Dark if story sets default to "dark" OR user selected dark background via toolbar
      const isDark = storyBgDefault === "dark" || globalBgValue === "#09090b";

      return (
        <div className={isDark ? "dark" : ""}>
          <div className="min-h-screen bg-background dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
