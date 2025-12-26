import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import SvgPreview from "./SvgPreview";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <circle cx="100" cy="100" r="50" fill="#78c95a">
    <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
  </circle>
  <text x="50%" y="180" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="12">
    Ready to create...
  </text>
</svg>`;

const BOUNCING_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <circle cx="100" cy="50" r="20" fill="#ef4444">
    <animate attributeName="cy" values="50;150;50" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
  </circle>
</svg>`;

const SPINNING_SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <rect x="75" y="75" width="50" height="50" fill="#3b82f6">
    <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="2s" repeatCount="indefinite" />
  </rect>
</svg>`;

const meta: Meta<typeof SvgPreview> = {
  title: "Components/SvgPreview",
  component: SvgPreview,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The main SVG preview canvas with zoom controls, grid background, fullscreen mode, and AI explanation display. Supports live animated SVGs.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    svgCode: {
      control: "text",
      description: "The SVG code to render",
    },
    explanation: {
      control: "text",
      description: "AI-generated explanation displayed in the corner",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading overlay when generating",
    },
    isDarkMode: {
      control: "boolean",
      description: "Adjusts grid color for dark mode",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    svgCode: SAMPLE_SVG,
    explanation: "A pulsing green circle animation.",
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert SVG is rendered
    const svgElement = canvasElement.querySelector("svg");
    await expect(svgElement).toBeInTheDocument();

    // Assert explanation is displayed
    await expect(canvas.getByText(/AI Note:/i)).toBeInTheDocument();
    await expect(canvas.getByText(/pulsing green circle/i)).toBeInTheDocument();

    // Assert toolbar controls are present
    await expect(canvas.getByTitle("Toggle Grid")).toBeInTheDocument();
    await expect(canvas.getByText("100%")).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    svgCode: SAMPLE_SVG,
    isLoading: true,
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert loading overlay is displayed
    await expect(canvas.getByText(/Generating Animation/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Crafting code with Gemini/i)).toBeInTheDocument();
  },
};

export const DarkMode: Story = {
  args: {
    svgCode: SAMPLE_SVG,
    explanation: "A pulsing green circle animation.",
    isDarkMode: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert SVG is rendered in dark mode
    const svgElement = canvasElement.querySelector("svg");
    await expect(svgElement).toBeInTheDocument();

    // Assert explanation is displayed
    await expect(canvas.getByText(/AI Note:/i)).toBeInTheDocument();
  },
};

export const BouncingBall: Story = {
  args: {
    svgCode: BOUNCING_BALL_SVG,
    explanation: "A bouncing ball with eased animation using spline interpolation.",
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/bouncing ball/i)).toBeInTheDocument();
  },
};

export const SpinningSquare: Story = {
  args: {
    svgCode: SPINNING_SQUARE_SVG,
    explanation: "A continuously rotating square using animateTransform.",
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/rotating square/i)).toBeInTheDocument();
  },
};

export const NoExplanation: Story = {
  args: {
    svgCode: SAMPLE_SVG,
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Assert no AI Note is displayed when no explanation
    const aiNote = canvas.queryByText(/AI Note:/i);
    await expect(aiNote).not.toBeInTheDocument();
  },
};

export const EmptySvg: Story = {
  args: {
    svgCode: "",
    explanation: "No SVG content to display.",
    isDarkMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // SVG element should not exist when code is empty
    const svgElement = canvasElement.querySelector("svg");
    await expect(svgElement).not.toBeInTheDocument();
  },
};

export const ZoomControls: Story = {
  name: "Zoom Controls ▶",
  args: {
    svgCode: SAMPLE_SVG,
    explanation: "Testing zoom controls.",
    isDarkMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Initial zoom is 100%", async () => {
      const zoomDisplay = canvas.getByText("100%");
      await expect(zoomDisplay).toBeInTheDocument();
    });

    await step("Click zoom in button", async () => {
      const zoomInButton = canvasElement.querySelector('button[class*="hover:text-zinc"]');
      // Find the button that contains ZoomIn icon (after the zoom display)
      const buttons = canvas.getAllByRole("button");
      const zoomInBtn = buttons.find((btn) =>
        btn.querySelector('svg.lucide-zoom-in') ||
        btn.getAttribute("class")?.includes("hover:text-zinc")
      );

      if (zoomInBtn) {
        await userEvent.click(zoomInBtn);
      }
    });

    await step("Click reset zoom button", async () => {
      // Click the zoom percentage to reset
      const zoomDisplay = canvas.getByTitle("Click to Reset Zoom");
      await userEvent.click(zoomDisplay);
      await expect(canvas.getByText("100%")).toBeInTheDocument();
    });
  },
};

export const GridToggle: Story = {
  name: "Grid Toggle ▶",
  args: {
    svgCode: SAMPLE_SVG,
    explanation: "Testing grid toggle.",
    isDarkMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Find grid toggle button", async () => {
      const gridButton = canvas.getByTitle("Toggle Grid");
      await expect(gridButton).toBeInTheDocument();
    });

    await step("Toggle grid off", async () => {
      const gridButton = canvas.getByTitle("Toggle Grid");
      await userEvent.click(gridButton);
    });

    await step("Toggle grid back on", async () => {
      const gridButton = canvas.getByTitle("Toggle Grid");
      await userEvent.click(gridButton);
    });
  },
};
