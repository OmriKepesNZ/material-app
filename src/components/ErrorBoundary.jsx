// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(err) {
    return { error: err };
  }

  componentDidCatch(err, info) {
    console.error("Render error:", err, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 40,
            fontFamily: "monospace",
            fontSize: 13,
            color: "#EF4444",
            background: "#FEF2F2",
            borderRadius: 12,
            margin: 20,
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Render Error</strong>
          <br />
          <br />
          {this.state.error.message}
          <br />
          <br />
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "6px 14px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}