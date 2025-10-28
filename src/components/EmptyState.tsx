'use client';

import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  imagePath: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, imagePath, actionButton }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="mb-8">
          <Image
            src={imagePath}
            alt={title}
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
}