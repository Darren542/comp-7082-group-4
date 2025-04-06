import React from 'react'
import { ServerAddonType } from '../AddonManagerContext/AddonManagerController'
import { useAvailableAddon } from './hooks/useAvailableAddon';

type AvailableAddonProps = {
  details: ServerAddonType
  update: (newStatus: ServerAddonType) => void
}

export const AvailableAddon = ({ details, update }: AvailableAddonProps) => {
  const { status } = useAvailableAddon(details);

  return (
    <div className="border border-gray-200 mx-auto flex max-w-sm items-stretch justify-between gap-4 bg-white p-4 shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-md">
      {/* Left side */}
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {details.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{details.desc}</p>
      </div>
  
      {/* Right side */}
      <div className="flex flex-col justify-between items-end h-full text-right">
        <button
          className="px-2 mb-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
          onClick={() => update({ ...details, installed: true, active: true })}
          aria-label={`Add ${details.name}`}
        >
          Add
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 self-end">
          Status: {status}
        </p>
      </div>
    </div>
  );
};