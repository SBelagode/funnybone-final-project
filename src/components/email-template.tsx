import * as React from "react";

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Crackd.ai";
const appEnvironment = (process.env.NEXT_PUBLIC_ENVIRONMENT || "local").toLowerCase();
const isProduction = appEnvironment === "production";
const brandPrimary = isProduction ? "#E6BB00" : "#D31212";
const brandAccent = isProduction ? "#FFD51A" : "#EF4444";
const brandForeground = isProduction ? "#1a1a1a" : "#ffffff";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div>
    <h1>Welcome, {firstName}!</h1>
  </div>
);

interface BugReportEmailTemplateProps {
  subject: string;
  message: string;
  userEmail: string;
}

export const BugReportEmailTemplate: React.FC<
  Readonly<BugReportEmailTemplateProps>
> = ({ subject, message, userEmail }) => (
  <div
    style={{
      fontFamily: "var(--font-merriweather-sans), sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
      padding: "0",
      backgroundColor: "#ffffff",
      color: "#1a1a1a",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    }}
  >
    {/* Header */}
    <div
      style={{
        textAlign: "center",
        padding: "32px 24px",
        background: `linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%)`,
        color: brandForeground,
        position: "relative",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontSize: "28px",
          margin: "0",
          fontWeight: "700",
          letterSpacing: "-0.5px",
        }}
      >
        New Bug Report
      </h1>
      <p
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          margin: "8px 0 0 0",
          fontSize: "16px",
          opacity: "0.9",
        }}
      >
        {brandName} Support
      </p>
    </div>

    {/* Content */}
    <div
      style={{
        padding: "32px 24px",
      }}
    >
      {/* User Info Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              color: brandPrimary,
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Reporter
          </div>
          <div
            style={{
              color: "#1a1a1a",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            {userEmail}
          </div>
        </div>

        {subject && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-poppins), sans-serif",
                color: brandPrimary,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "4px",
              }}
            >
              Subject
            </div>
            <div
              style={{
                color: "#1a1a1a",
                fontWeight: "500",
                fontSize: "15px",
              }}
            >
              {subject}
            </div>
          </div>
        )}
      </div>

      {/* Message Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-poppins), sans-serif",
            color: brandPrimary,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "12px",
          }}
        >
          Message
        </div>
        <div
          style={{
            whiteSpace: "pre-wrap",
            color: "#333",
            lineHeight: "1.6",
            fontSize: "15px",
          }}
        >
          {message}
        </div>
      </div>
    </div>

    {/* Footer */}
    <div
      style={{
        textAlign: "center",
        padding: "24px",
        backgroundColor: "#f8f9fa",
        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
        color: "#666",
        fontSize: "14px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          margin: "0 0 8px 0",
        }}
      >
        This is an automated message from {brandName}
      </p>
      <p
        style={{
          margin: "0",
          fontSize: "12px",
          color: "#999",
        }}
      >
        © {new Date().getFullYear()} {brandName}. All rights reserved.
      </p>
    </div>
  </div>
);
