import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export const CodeBlock: React.FC<{ code: string; language?: string }> = ({
  code,
  language = "tsx",
}) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      customStyle={{
        borderRadius: 8,
        fontSize: 13,
        margin: "12px 0",
        padding: "14px 16px",
      }}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
};
