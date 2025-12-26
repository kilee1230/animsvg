import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "@storybook/test";
import { Download, Send, Trash2 } from "lucide-react";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile button component with multiple variants and states. Supports icons, loading states, and all standard button attributes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
      description: "Visual style variant of the button",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading spinner and disables the button",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
    icon: {
      control: false,
      description: "Optional icon to display before the label",
    },
    children: {
      control: "text",
      description: "Button label text",
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /primary button/i });

    // Assert button is rendered correctly
    await expect(button).toBeInTheDocument();
    await expect(button).toHaveTextContent("Primary Button");

    // Simulate click
    await userEvent.click(button);

    // Assert onClick was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /secondary button/i });

    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /ghost button/i });

    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Danger: Story = {
  args: {
    children: "Delete",
    variant: "danger",
    icon: <Trash2 className="w-4 h-4" />,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /delete/i });

    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const WithIcon: Story = {
  args: {
    children: "Download",
    variant: "secondary",
    icon: <Download className="w-4 h-4" />,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /download/i });

    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: {
    children: "Generating...",
    variant: "primary",
    isLoading: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Assert button shows loading state
    await expect(button).toBeInTheDocument();
    await expect(button).toHaveTextContent("Processing...");

    // Assert button is disabled when loading
    await expect(button).toBeDisabled();

    // Click should not trigger onClick when disabled
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    variant: "primary",
    disabled: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /disabled/i });

    // Assert button is disabled
    await expect(button).toBeDisabled();

    // Click should not trigger onClick when disabled
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const IconOnly: Story = {
  args: {
    icon: <Send className="w-4 h-4" />,
    variant: "primary",
    className: "px-3",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert all variants are rendered
    await expect(
      canvas.getByRole("button", { name: /primary/i })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /secondary/i })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /ghost/i })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /danger/i })
    ).toBeInTheDocument();
  },
};
