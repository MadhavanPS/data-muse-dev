import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        /* IDE Color System */
        panel: {
          background: "hsl(var(--panel-background))",
          foreground: "hsl(var(--panel-foreground))",
          border: "hsl(var(--panel-border))",
        },
        editor: {
          background: "hsl(var(--editor-background))",
          foreground: "hsl(var(--editor-foreground))",
          selection: "hsl(var(--editor-selection))",
          "line-numbers": "hsl(var(--editor-line-numbers))",
        },
        sidebar: {
          background: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          active: "hsl(var(--sidebar-active))",
        },
        tab: {
          background: "hsl(var(--tab-background))",
          active: "hsl(var(--tab-active))",
          hover: "hsl(var(--tab-hover))",
          border: "hsl(var(--tab-border))",
        },
        viz: {
          background: "hsl(var(--viz-background))",
          border: "hsl(var(--viz-border))",
          header: "hsl(var(--viz-header))",
        },
        chat: {
          background: "hsl(var(--chat-background))",
          "message-user": "hsl(var(--chat-message-user))",
          "message-ai": "hsl(var(--chat-message-ai))",
        },
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          hover: "hsl(var(--secondary-hover))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          hover: "hsl(var(--accent-hover))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        /* Status Colors */
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-panel': 'var(--gradient-panel)',
        'gradient-accent': 'var(--gradient-accent)',
      },
      boxShadow: {
        'ide-sm': 'var(--shadow-sm)',
        'ide-md': 'var(--shadow-md)',
        'ide-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
