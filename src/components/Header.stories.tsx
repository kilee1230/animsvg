import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "@storybook/test";
import Header from "./Header";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The main application header with branding, Gemini status, and theme toggle functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isDarkMode: {
      control: "boolean",
      description: "Current theme state",
    },
    toggleTheme: {
      action: "toggleTheme",
      description: "Function to toggle between light and dark mode",
    },
  },
  args: {
    toggleTheme: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = {
  args: {
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert header elements are rendered
    await expect(canvas.getByText("AnimSVG")).toBeInTheDocument();
    await expect(canvas.getByText("AI")).toBeInTheDocument();
    await expect(canvas.getByText(/Powered by Gemini/i)).toBeInTheDocument();

    // Assert theme toggle button shows moon icon (to switch to dark mode)
    const themeButton = canvas.getByRole("button", {
      name: /switch to dark mode/i,
    });
    await expect(themeButton).toBeInTheDocument();
  },
};

export const DarkMode: Story = {
  args: {
    isDarkMode: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert header elements are rendered
    await expect(canvas.getByText("AnimSVG")).toBeInTheDocument();

    // Assert theme toggle button shows sun icon (to switch to light mode)
    const themeButton = canvas.getByRole("button", {
      name: /switch to light mode/i,
    });
    await expect(themeButton).toBeInTheDocument();
  },
};

export const ThemeToggleInteraction: Story = {
  name: "Theme Toggle Click ▶",
  args: {
    isDarkMode: false,
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Find theme toggle button", async () => {
      const themeButton = canvas.getByRole("button", {
        name: /switch to dark mode/i,
      });
      await expect(themeButton).toBeInTheDocument();
    });

    await step("Click theme toggle", async () => {
      const themeButton = canvas.getByRole("button", {
        name: /switch to dark mode/i,
      });
      await userEvent.click(themeButton);

      // Assert toggleTheme was called
      await expect(args.toggleTheme).toHaveBeenCalledTimes(1);
    });

    await step("Click theme toggle again", async () => {
      const themeButton = canvas.getByRole("button", {
        name: /switch to dark mode/i,
      });
      await userEvent.click(themeButton);

      // Assert toggleTheme was called twice
      await expect(args.toggleTheme).toHaveBeenCalledTimes(2);
    });
  },
};
