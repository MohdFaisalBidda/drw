import React from "react";
import Link from "next/link";

export const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">{children}</div>
);

export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
    {children}
  </div>
);

export const Heading = ({ text }: { text: string }) => (
  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
    {text}
  </h1>
);

export const Subheading = ({ text }: { text: string }) => (
  <p className="text-gray-600 mt-2 text-lg">{text}</p>
);

export const Input = ({
  id,
  placeholder,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {id}
    </label>
    <input
      id={id}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 ${className}`}
      onChange={onChange}
    />
  </div>
);

export const Button = ({
  text,
  onClick,
  variant = "primary",
  href,
  className,
}: {
  text?: string | React.ReactElement;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  href?: string;
  className?: string;
}) => {
  // const classNames =
  let classNames = "";
  switch (variant) {
    case "primary":
      classNames =
        "w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200";

    case "secondary":
      classNames =
        "w-full bg-white text-gray-700 py-3 px-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200";

    case "outline":
      classNames =
        "w-full bg-none text-gray-700 py-3 px-4 rounded-xl font-medium border border-gray-200 border-solid hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200";

    default:
      break;
  }

  if (href) {
    return (
      <Link href={href}>
        <button className={`${classNames} ${className}`}>{text}</button>
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {text | }
    </button>
  );
};

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
    {message}
  </div>
);
