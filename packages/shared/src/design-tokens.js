export const designTokens = {
  primitive: {
    color: {
      ink: "#202124",
      forest: "#243B35",
      amber: "#F4B942",
      coral: "#B94E3E",
      paper: "#F7F4EF",
      surface: "#FFFFFF",
      line: "#E5DFD3"
    },
    radius: {
      control: 8,
      panel: 8
    },
    space: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24
    }
  },
  semantic: {
    background: "paper",
    foreground: "ink",
    primary: "forest",
    accent: "amber",
    danger: "coral",
    success: "forest",
    border: "line"
  },
  component: {
    button: {
      minHeight: 48,
      radius: "control"
    },
    touchTarget: {
      minSize: 44
    },
    card: {
      radius: "panel",
      border: "line"
    }
  }
};
