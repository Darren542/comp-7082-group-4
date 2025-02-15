import React from 'react'
import { ServerAddonType } from '../AddonManagerContext/AddonManagerController'

type AvailableAddonProps = {
  details: ServerAddonType
  update: (newStatus: ServerAddonType) => void
}

export const AvailableAddon = ({ details, update }: AvailableAddonProps) => {
  return (
    <div className="border border-gray-200 mx-auto flex max-w-sm justify-between items-start gap-4 bg-white p-4 shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{details.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{details.desc}</p>
      </div>

      <button
        className="shrink-0 px-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500 cursor-pointer"
        onClick={() => update({ ...details, installed: true, active: true })}
        aria-label={`Add ${details.name}`}
      >
        Add
      </button>
    </div>
  );
}
