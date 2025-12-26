import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "@storybook/test";
import CodeEditor from "./CodeEditor";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <!-- Animated circle -->
  <circle cx="100" cy="100" r="50" fill="#78c95a">
    <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
  </circle>
  <text x="50%" y="180" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="12">
    Ready to create...
  </text>
</svg>`;

const meta: Meta<typeof CodeEditor> = {
  title: "Components/CodeEditor",
  component: CodeEditor,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A lightweight SVG code editor with syntax highlighting. Features include synchronized scrolling between the editable layer and the highlighted preview.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "The SVG code content",
    },
    onChange: {
      action: "onChange",
      description: "Callback fired when the code changes",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: SAMPLE_SVG,
    className: "h-full",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert textarea is rendered with the SVG content
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeInTheDocument();
    await expect(textarea).toHaveValue(SAMPLE_SVG);
  },
};

export const Empty: Story = {
  args: {
    value: "",
    className: "h-full",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert textarea is rendered and empty
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeInTheDocument();
    await expect(textarea).toHaveValue("");
  },
};

export const SimpleElement: Story = {
  args: {
    value: `<svg viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
</svg>`,
    className: "h-full",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeInTheDocument();
    // Check that the value contains rect element
    const value = (textarea as HTMLTextAreaElement).value;
    await expect(value).toContain("<rect");
  },
};

export const WithAnimation: Story = {
  args: {
    value: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="20" fill="#ff6b6b">
    <animate 
      attributeName="cx" 
      from="20" 
      to="80" 
      dur="2s" 
      repeatCount="indefinite" 
      calcMode="spline"
      keySplines="0.4 0 0.2 1"
    />
  </circle>
</svg>`,
    className: "h-full",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeInTheDocument();
    // Check that the value contains animate element
    const value = (textarea as HTMLTextAreaElement).value;
    await expect(value).toContain("<animate");
  },
};

export const FocusInteraction: Story = {
  name: "Focus Editor ▶",
  args: {
    value: "<svg></svg>",
    className: "h-full",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");

    await step("Editor is rendered", async () => {
      await expect(textarea).toBeInTheDocument();
      await expect(textarea).toHaveValue("<svg></svg>");
    });

    await step("Click to focus the editor", async () => {
      await userEvent.click(textarea);
      await expect(textarea).toHaveFocus();
    });
  },
};

export const TypingTriggersOnChange: Story = {
  name: "Typing Triggers onChange ▶",
  args: {
    value: "",
    className: "h-full",
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");

    await step("Focus the editor", async () => {
      await userEvent.click(textarea);
      await expect(textarea).toHaveFocus();
    });

    await step("Type triggers onChange callback", async () => {
      // Type a single character to trigger onChange
      await userEvent.type(textarea, "a");
      // Assert onChange was called (controlled component - value managed by parent)
      await expect(args.onChange).toHaveBeenCalled();
    });
  },
};

export const KeyboardNavigation: Story = {
  name: "Keyboard Navigation ▶",
  args: {
    value: "<svg>\n  <circle />\n</svg>",
    className: "h-full",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");

    await step("Focus and navigate", async () => {
      await userEvent.click(textarea);
      await expect(textarea).toHaveFocus();
    });

    await step("Press arrow keys", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{ArrowUp}");
      await userEvent.keyboard("{End}");
      await userEvent.keyboard("{Home}");
      // Editor should still have focus after navigation
      await expect(textarea).toHaveFocus();
    });
  },
};
