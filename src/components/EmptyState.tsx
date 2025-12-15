'use client';

import Image from 'next/image';
import { PlusIcon } from '@heroicons/react/24/outline';

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
        <div className="mb-4">
          <Image
            src={imagePath}
            alt={title}
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
}