import React from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
