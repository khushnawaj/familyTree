import React from 'react';
import { X, Sliders } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onUpdate }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-[450px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-teal-600" />
                        Tree Settings
                    </h3>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <div className="flex items-center justify-between border-b border-slate-100 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold text-slate-800">Show Avatars</span>
                            <span className="text-xs text-slate-500">Display member photos on nodes</span>
                        </div>
                        <label className="relative inline-block h-6 w-11">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={settings.showAvatars}
                                onChange={() => onUpdate('showAvatars', !settings.showAvatars)}
                            />
                            <span className="absolute inset-0 cursor-pointer rounded-full bg-slate-300 transition peer-checked:bg-teal-600 before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:transition peer-checked:before:translate-x-5" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold text-slate-800">Show Biography</span>
                            <span className="text-xs text-slate-500">Display short bio snippets</span>
                        </div>
                        <label className="relative inline-block h-6 w-11">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={settings.showBio}
                                onChange={() => onUpdate('showBio', !settings.showBio)}
                            />
                            <span className="absolute inset-0 cursor-pointer rounded-full bg-slate-300 transition peer-checked:bg-teal-600 before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:transition peer-checked:before:translate-x-5" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold text-slate-800">Show Dates</span>
                            <span className="text-xs text-slate-500">Display birth and death years</span>
                        </div>
                        <label className="relative inline-block h-6 w-11">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={settings.showDates}
                                onChange={() => onUpdate('showDates', !settings.showDates)}
                            />
                            <span className="absolute inset-0 cursor-pointer rounded-full bg-slate-300 transition peer-checked:bg-teal-600 before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:transition peer-checked:before:translate-x-5" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold text-slate-800">Grid Background</span>
                            <span className="text-xs text-slate-500">Show helper lines on canvas</span>
                        </div>
                        <label className="relative inline-block h-6 w-11">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={settings.showGrid}
                                onChange={() => onUpdate('showGrid', !settings.showGrid)}
                            />
                            <span className="absolute inset-0 cursor-pointer rounded-full bg-slate-300 transition peer-checked:bg-teal-600 before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:transition peer-checked:before:translate-x-5" />
                        </label>
                    </div>
                </div>

                <div className="bg-slate-50 p-6">
                    <button className="w-full rounded-lg bg-teal-700 px-4 py-3 font-bold text-white hover:bg-teal-800" onClick={onClose}>DONE</button>
                </div>
            </div>
        </div>
    );
}
