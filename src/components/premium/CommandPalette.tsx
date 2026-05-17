import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  group?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  items,
  placeholder = 'Rechercher une action, page, document...',
  emptyMessage = 'Aucun resultat.',
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groups = [...new Set(items.map((item) => item.group || 'Actions'))];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-0 top-[15vh] z-[9999] mx-auto w-full max-w-xl px-4"
          >
            <Command
              className="
                rounded-2xl overflow-hidden
                bg-white dark:bg-slate-900
                border border-slate-200/80 dark:border-slate-700/60
                shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)]
              "
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
                <svg
                  className="w-4 h-4 text-slate-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Command.Input
                  placeholder={placeholder}
                  className="flex-1 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-transparent outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-slate-400">
                  {emptyMessage}
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400"
                  >
                    {items
                      .filter((item) => (item.group || 'Actions') === group)
                      .map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.description || ''}`}
                          onSelect={() => {
                            item.onSelect();
                            setOpen(false);
                          }}
                          className="
                            flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                            text-sm text-slate-700 dark:text-slate-200
                            data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800
                            transition-colors
                          "
                        >
                          {item.icon && (
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                              {item.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {item.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      &uarr;&darr;
                    </kbd>
                    naviguer
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      &crarr;
                    </kbd>
                    selectionner
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
