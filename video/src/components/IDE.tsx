import React from "react";
import { COLORS } from "../utils/colors";
import { FILE_TREE } from "../utils/code-samples";

interface IDEProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showTabs?: boolean;
  activeFile?: string;
}

export const IDE: React.FC<IDEProps> = ({
  children,
  showSidebar = true,
  showTabs = true,
  activeFile = "chatbot.ts",
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.ide.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          height: 32,
          backgroundColor: COLORS.ide.bgLight,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          borderBottom: `1px solid ${COLORS.gray[800]}`,
        }}
      >
        {/* Traffic Lights */}
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#28c840",
              opacity: 0.9,
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: COLORS.gray[500],
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {activeFile} — Visual Studio Code
        </div>
        <div style={{ width: 52 }} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        {showSidebar && (
          <div
            style={{
              width: 200,
              backgroundColor: COLORS.ide.sidebar,
              borderRight: `1px solid ${COLORS.gray[800]}`,
              padding: "8px 0",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                color: COLORS.gray[500],
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Explorer
            </div>
            <FileTree />
          </div>
        )}

        {/* Editor Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          {showTabs && (
            <div
              style={{
                height: 32,
                backgroundColor: COLORS.ide.bgLight,
                display: "flex",
                borderBottom: `1px solid ${COLORS.gray[800]}`,
              }}
            >
              <Tab name={activeFile} active />
            </div>
          )}

          {/* Editor Content */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        style={{
          height: 22,
          backgroundColor: COLORS.gray[900],
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          fontSize: 11,
          color: COLORS.gray[500],
          justifyContent: "space-between",
          borderTop: `1px solid ${COLORS.gray[800]}`,
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <span>main</span>
          <span>TypeScript</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <span>UTF-8</span>
          <span>LF</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};

interface TabProps {
  name: string;
  active?: boolean;
}

const Tab: React.FC<TabProps> = ({ name, active = false }) => {
  return (
    <div
      style={{
        padding: "6px 14px",
        backgroundColor: active ? COLORS.ide.bg : "transparent",
        color: active ? COLORS.gray[300] : COLORS.gray[600],
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderRight: `1px solid ${COLORS.gray[800]}`,
        fontSize: 12,
      }}
    >
      <TypeScriptIcon />
      {name}
    </div>
  );
};

const TypeScriptIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect width="16" height="16" rx="2" fill="#3178c6" />
    <text
      x="8"
      y="11.5"
      fontSize="9"
      fontWeight="bold"
      fill="white"
      textAnchor="middle"
    >
      TS
    </text>
  </svg>
);

const FileTree: React.FC = () => {
  return (
    <div style={{ padding: "0 4px" }}>
      {FILE_TREE.map((item, index) => (
        <FileTreeItem key={index} {...item} />
      ))}
    </div>
  );
};

interface FileTreeItemProps {
  name: string;
  type: "file" | "folder";
  level: number;
  active?: boolean;
  open?: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  name,
  type,
  level,
  active = false,
  open = false,
}) => {
  const getIcon = () => {
    if (type === "folder") {
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill={COLORS.gray[500]}>
          <path d="M1.5 3.5h4l1 1h6v7h-11v-8z" fillOpacity="0.8" />
        </svg>
      );
    }

    if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      return <TypeScriptIcon />;
    }

    if (name.endsWith(".json")) {
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill={COLORS.gray[500]}>
          <rect x="2" y="2" width="12" height="12" rx="2" fillOpacity="0.8" />
        </svg>
      );
    }

    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill={COLORS.gray[600]}>
        <path d="M3 2h7l3 3v9H3V2z" fillOpacity="0.8" />
      </svg>
    );
  };

  return (
    <div
      style={{
        padding: "3px 8px",
        paddingLeft: 8 + level * 14,
        display: "flex",
        alignItems: "center",
        gap: 5,
        backgroundColor: active ? COLORS.ide.sidebarActive : "transparent",
        color: active ? COLORS.gray[300] : COLORS.gray[500],
        fontSize: 12,
        borderRadius: 3,
      }}
    >
      {getIcon()}
      {name}
    </div>
  );
};
