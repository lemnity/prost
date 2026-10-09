"use client";

import { createTheme } from "@mui/material/styles";

/** Тема Material UI в цветах сайта (токены из globals.css). */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: "#D02E31", dark: "#B5252A", contrastText: "#FFFFFF" },
    secondary: { main: "#25234F", contrastText: "#FFFFFF" },
    text: { primary: "#1A1A1A", secondary: "#636564" },
    divider: "#ECECEC",
    background: { default: "#FFFFFF", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
